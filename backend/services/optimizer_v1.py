import math

def optimize_path(items, store_layout, start_position=(0, 0)):
    racks = {r["rack_id"]: r for r in store_layout["racks"]}

    enriched = []

    for item in items:
        rack = racks.get(item["rack_id"])
        if not rack:
            continue  # skip invalid

        x, y = compute_pickup_point(item, rack)
        dist = math.sqrt(
            (x - start_position[0]) ** 2 +
            (y - start_position[1]) ** 2
        )

        enriched.append({
            **item,
            "pickup_point": {"x": x, "y": y},
            "distance": dist
        })

    enriched.sort(key=lambda i: i["distance"])

    return {
        "optimized_path": [
            {k: v for k, v in item.items() if k != "distance"}
            for item in enriched
        ]
    }

def compute_pickup_point(item, rack):
    orientation = rack["meta"]["orientation"]
    facing = rack["meta"]["facing"]
    total = rack["meta"]["total_columns"]
    idx = item["position_index"]

    if orientation == "horizontal":
        x = rack["x"] + (idx - 0.5) / total * rack["w"]
        y = rack["y"] + (rack["h"] if facing == "bottom" else 0)
    else:
        x = rack["x"] + (rack["w"] if facing == "right" else 0)
        y = rack["y"] + (idx - 0.5) / total * rack["h"]

    return (x, y)

layout = {
    "racks": [
        {
            "rack_id": "A2",
            "x": 10,
            "y": 4,
            "w": 20,
            "h": 1,
            "meta": {
                "orientation": "horizontal",
                "facing": "bottom",
                "total_columns": 20
            }
        }
    ]
}