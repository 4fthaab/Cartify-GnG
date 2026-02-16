import json
import matplotlib.pyplot as plt
from services.path_optimizer import build_grid, astar


def draw_map(grid, entry, billing, path=None):

    rows = len(grid)
    cols = len(grid[0])

    fig, ax = plt.subplots()

    # Draw grid
    for y in range(rows):
        for x in range(cols):
            if grid[y][x] == 0:
                ax.add_patch(plt.Rectangle((x, rows - y - 1), 1, 1, color="black"))
            else:
                ax.add_patch(plt.Rectangle((x, rows - y - 1), 1, 1, edgecolor="lightgray", fill=False))

    # Draw entry
    ax.add_patch(plt.Rectangle((entry[0], rows - entry[1] - 1), 1, 1, color="green"))

    # Draw billing
    ax.add_patch(plt.Rectangle((billing[0], rows - billing[1] - 1), 1, 1, color="blue"))

    # Draw path
    if path:
        xs = [p[0] + 0.5 for p in path]
        ys = [rows - p[1] - 0.5 for p in path]

        ax.plot(xs, ys, color="red", linewidth=2)

        # arrows
        for i in range(1, len(xs)):
            ax.arrow(
                xs[i-1], ys[i-1],
                xs[i] - xs[i-1],
                ys[i] - ys[i-1],
                head_width=0.2,
                head_length=0.2,
                fc='red',
                ec='red',
                length_includes_head=True
            )

    ax.set_xlim(0, cols)
    ax.set_ylim(0, rows)
    ax.set_aspect("equal")
    ax.set_title("Cartify Path Debugger")
    plt.gca().invert_yaxis()
    plt.show()

from services.path_optimizer import optimize_path, compute_pickup_point

if __name__ == "__main__":

    with open("st001_layout.json") as f:
        layout = json.load(f)

    grid, entry, billing = build_grid(layout)

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

    optimized = optimize_path(matched_items, layout)

    # Build full path by chaining A* segments
    full_path = []
    current = entry

    for item in optimized:
        goal = (item["pickup_point"]["x"], item["pickup_point"]["y"])
        segment = astar(grid, current, goal)
        full_path += segment[:-1]
        current = goal

    # final to billing
    segment = astar(grid, current, billing)
    full_path += segment

    draw_map(grid, entry, billing, full_path)
