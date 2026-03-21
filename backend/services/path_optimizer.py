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

    # 3️⃣ Process elements safely
    for element in layout["elements"]:

        element_type = element.get("type")

        # 🚫 Ignore aisle markers completely
        if element_type == "aisle_marker":
            continue

        x = element.get("x")
        y = element.get("y")

        # Only racks & blocked zones have width/height
        if element_type in ["rack", "blocked"]:
            w = element.get("w", 0)
            h = element.get("h", 0)

            # Racks are blocked
            if element_type == "rack":
                for dx in range(w):
                    for dy in range(h):
                        grid[y + dy][x + dx] = 0

            # Walls & restricted areas are blocked
            if element_type == "blocked":
                zone = element.get("zoneType")

                if zone in ["wall", "restricted"]:
                    for dx in range(w):
                        for dy in range(h):
                            grid[y + dy][x + dx] = 0

                # Entry
                if zone == "entry":
                    entry_point = (x + w // 2, y + h // 2)

                # Billing
                if zone == "billing":
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

def tsp_2opt(order, distance):
    """Refines the path to eliminate criss-crossing (Greedy Traps)"""
    improved = True
    best_order = order[:]
    
    def path_distance(p):
        d = 0
        for i in range(len(p)-1):
            # Handle mixing of tuples (entry/billing) and dicts (items)
            coord1 = p[i] if isinstance(p[i], tuple) else p[i]["pickup_point"]
            coord2 = p[i+1] if isinstance(p[i+1], tuple) else p[i+1]["pickup_point"]
            d += distance.get((coord1, coord2), float('inf'))
        return d

    while improved:
        improved = False
        # Do not reverse the Entry (0) or Billing (len-1) points
        for i in range(1, len(best_order) - 2):
            for j in range(i + 1, len(best_order) - 1):
                new_order = best_order[:i] + best_order[i:j+1][::-1] + best_order[j+1:]
                if path_distance(new_order) < path_distance(best_order):
                    best_order = new_order
                    improved = True
    return best_order


def optimize_path(matched_items, layout):
    # 1️⃣ Build grid
    grid, entry, billing = build_grid(layout)

    # 2️⃣ Track ITEMS, not just coordinates (fixes the dropped items bug)
    item_coords = []
    unique_coords = set()
    unique_coords.add(entry)
    unique_coords.add(billing)

    for item in matched_items:
        pickup = compute_pickup_point(item, layout)
        item["pickup_point"] = pickup
        item_coords.append(item)
        unique_coords.add(pickup)

    # 3️⃣ Compute distance matrix ONLY for unique coordinates (saves compute)
    dist_matrix = compute_distance_matrix(grid, list(unique_coords))

    # 4️⃣ TSP Nearest Neighbor (Using Items)
    unvisited = list(item_coords)
    order = [entry]
    current_coord = entry

    while unvisited:
        # Find the closest actual item
        best_item = min(
            unvisited,
            key=lambda x: dist_matrix.get((current_coord, x["pickup_point"]), float("inf"))
        )
        order.append(best_item)
        unvisited.remove(best_item)
        current_coord = best_item["pickup_point"]

    order.append(billing)

    # 5️⃣ Smooth out the path to remove jumps
    order = tsp_2opt(order, dist_matrix)

    # 6️⃣ Build response (exclude entry & billing)
    optimized_path = []
    for item in order[1:-1]:
        optimized_path.append({
            "item_id": item["item_id"],
            "rack_id": item["rack_id"],
            "position_index": item["position_index"],
            "pickup_point": {"x": item["pickup_point"][0], "y": item["pickup_point"][1]}
        })
    
    return optimized_path   