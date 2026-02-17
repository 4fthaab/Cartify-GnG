print("NEW OPTIMIZER CALLED")

def build_grid(layout: dict):

    # 1️⃣ Get grid size
    length_ft = layout["floor_area"]["length_ft"]
    width_ft = layout["floor_area"]["width_ft"]
    feet_per_cell = layout["floor_area"]["feet_per_cell"]

    cols = int(length_ft / feet_per_cell)
    rows = int(width_ft / feet_per_cell)

    # 2️⃣ Initialize grid (1 = walkable)
    grid = [[1 for _ in range(cols)] for _ in range(rows)]

    entry_point = None
    billing_point = None

    # 3️⃣ Mark blocked cells
    for element in layout["elements"]:

        x = element["x"]
        y = element["y"]
        w = element["w"]
        h = element["h"]

        # Racks are blocked
        if element["type"] == "rack":
            for dx in range(w):
                for dy in range(h):
                    grid[y + dy][x + dx] = 0

        # Walls are blocked
        if element["type"] == "blocked" and (element.get("zoneType") == "wall" or element.get("zoneType") == "restricted"):
            for dx in range(w):
                for dy in range(h):
                    grid[y + dy][x + dx] = 0

        # Entry
        if element["type"] == "blocked" and element.get("zoneType") == "entry":
            entry_point = (x + w // 2, y + h // 2)

        # Billing
        if element["type"] == "blocked" and element.get("zoneType") == "billing":
            billing_point = (x + w // 2, y + h // 2)

    return grid, entry_point, billing_point

def compute_pickup_point(item, layout):

    rack_id = item["rack_id"]
    position_index = item["position_index"]

    # Find rack in layout
    rack = next(
        e for e in layout["elements"]
        if e["type"] == "rack" and e["rack_id"] == rack_id
    )

    rack_x = rack["x"]
    rack_y = rack["y"]
    orientation = rack["meta"]["orientation"]
    facing = rack["meta"]["facing"]

    if orientation == "vertical":
        pickup_y = rack_y + (position_index - 1)

        if facing == "right":
            pickup_x = rack_x + rack["w"]
        else:  # facing left
            pickup_x = rack_x - 1

    else:  # horizontal rack
        pickup_x = rack_x + (position_index - 1)

        if facing == "top":
            pickup_y = rack_y - 1
        else:  # facing bottom
            pickup_y = rack_y + rack["h"]

    return (pickup_x, pickup_y)

import heapq

def astar(grid, start, goal):

    rows = len(grid)
    cols = len(grid[0])

    def heuristic(a, b):
        # Manhattan distance
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    open_set = []
    heapq.heappush(open_set, (0, start))

    came_from = {}
    g_score = {start: 0}

    while open_set:

        _, current = heapq.heappop(open_set)

        if current == goal:
            return reconstruct_path(came_from, current)

        x, y = current

        # 4-directional movement
        for dx, dy in [(1,0), (-1,0), (0,1), (0,-1)]:

            nx = x + dx
            ny = y + dy
            neighbor = (nx, ny)

            # boundary check
            if not (0 <= nx < cols and 0 <= ny < rows):
                continue

            # blocked check
            if grid[ny][nx] == 0:
                continue

            tentative_g = g_score[current] + 1

            if tentative_g < g_score.get(neighbor, float("inf")):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score, neighbor))

    return None

def reconstruct_path(came_from, current):

    path = [current]

    while current in came_from:
        current = came_from[current]
        path.append(current)

    path.reverse()
    return path

def compute_distance_matrix(grid, nodes):

    distance = {}

    for i in range(len(nodes)):
        for j in range(len(nodes)):
            if i == j:
                continue

            start = nodes[i]
            end = nodes[j]

            path = astar(grid, start, end)

            if path is None:
                dist = float("inf")
            else:
                dist = len(path)

            distance[(start, end)] = dist

    return distance

def tsp_nearest_neighbor(entry, pickups, billing, distance):

    unvisited = set(pickups)
    order = [entry]
    current = entry

    while unvisited:
        next_node = min(
            unvisited,
            key=lambda x: distance.get((current, x), float("inf"))
        )
        order.append(next_node)
        unvisited.remove(next_node)
        current = next_node

    order.append(billing)

    return order

def optimize_path(matched_items, layout):

    # 1️⃣ Build grid
    grid, entry, billing = build_grid(layout)

    # 2️⃣ Compute pickup points
    pickup_map = {}  # coordinate -> item
    pickup_points = []

    for item in matched_items:
        pickup = compute_pickup_point(item, layout)

        pickup_map[pickup] = item
        pickup_points.append(pickup)

    # 3️⃣ Build nodes list
    nodes = [entry] + pickup_points + [billing]

    # 4️⃣ Compute distance matrix
    dist_matrix = compute_distance_matrix(grid, nodes)

    # 5️⃣ Solve order
    ordered_nodes = tsp_nearest_neighbor(
        entry,
        pickup_points,
        billing,
        dist_matrix
    )

    # 6️⃣ Build response (exclude entry & billing)
    optimized_path = []

    for node in ordered_nodes:
        if node in pickup_map:
            item = pickup_map[node]

            optimized_path.append({
                "item_id": item["item_id"],
                "rack_id": item["rack_id"],
                "position_index": item["position_index"],
                "pickup_point": {
                    "x": node[0],
                    "y": node[1]
                }
            })
    
    print("Optimized order:")
    for item in optimized_path:
        print(item["rack_id"], item["pickup_point"])


    return optimized_path
