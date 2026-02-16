import json
from services.path_optimizer import build_grid

with open("st001_layout.json") as f:
    layout = json.load(f)

grid, entry, billing = build_grid(layout)

print("Entry:", entry)
print("Billing:", billing)
print("Grid size:", len(grid), "x", len(grid[0]))

from services.path_optimizer import compute_pickup_point

sample_item = {
    "rack_id": "str001r08",
    "position_index": 3
}

pickup = compute_pickup_point(sample_item, layout)
print("Pickup:", pickup)

from services.path_optimizer import astar

path = astar(grid, entry, pickup)

print("Path length:", len(path))
print("Last node:", path[-1])

from services.path_optimizer import compute_distance_matrix, tsp_nearest_neighbor

items = [
    {"rack_id": "str001r08", "position_index": 3},
    {"rack_id": "str001r09", "position_index": 5},
    {"rack_id": "str001r03", "position_index": 4},
]

pickup_points = []
for item in items:
    p = compute_pickup_point(item, layout)
    pickup_points.append(p)

nodes = [entry] + pickup_points + [billing]

dist_matrix = compute_distance_matrix(grid, nodes)

optimized_order = tsp_nearest_neighbor(entry, pickup_points, billing, dist_matrix)

print("Optimized Order:")
for node in optimized_order:
    print(node)

from services.path_optimizer import optimize_path

matched_items = [
    {
        "item_id": "ITEM038",
        "rack_id": "str001r08",
        "position_index": 3
    },
    {
        "item_id": "ITEM049",
        "rack_id": "str001r09",
        "position_index": 5
    },
    {
        "item_id": "ITEM040",
        "rack_id": "str001r03",
        "position_index": 4
    }
]

result = optimize_path(matched_items, layout)

print(result)

