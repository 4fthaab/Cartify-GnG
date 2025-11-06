# services/optimizer.py
def optimize_path(matched_items):
    """
    Optimizer using pair-wise rack traversal:
      - Group racks as (1,2), (3,4), (5,6), ...
      - For pair starting at r where r % 4 == 1 -> columns ascending, rack order r, r+1
      - For pair starting at r where r % 4 == 3 -> columns descending, rack order r+1, r
    matched_items: list of item documents (must include 'rack' like 'R1', and 'col')
    Returns: {"optimized_path": [ "<name> (RxcY)", ... ]}
    """
    if not matched_items:
        return {"optimized_path": []}

    # Helper to extract rack number integer from 'R1', 'r1', etc.
    def rack_num(item):
        rid = item.get("rack", "")
        digits = "".join([c for c in rid if c.isdigit()])
        return int(digits) if digits.isdigit() else 0

    # Build grouping: rack_number -> list(items)
    grouped = {}
    max_rack = 0
    for it in matched_items:
        rn = rack_num(it)
        if rn <= 0:
            continue
        grouped.setdefault(rn, []).append(it)
        if rn > max_rack:
            max_rack = rn

    optimized_order = []

    # Iterate over pairs (1,2), (3,4), (5,6), ...
    pair_start = 1
    while pair_start <= max_rack:
        rA = pair_start
        rB = pair_start + 1

        # gather all columns that exist in either rack
        cols = set()
        for it in grouped.get(rA, []):
            cols.add(it.get("col", 0))
        for it in grouped.get(rB, []):
            cols.add(it.get("col", 0))

        if not cols:
            pair_start += 2
            continue

        # Determine column order: ascending for pair starts 1,5,9... (pair_start % 4 == 1)
        ascending = (pair_start % 4 == 1)
        cols_sorted = sorted(cols, reverse=not ascending)

        # Within each column, determine rack order:
        # - ascending pairs -> rA then rB
        # - descending pairs -> rB then rA
        rack_order = [rA, rB] if ascending else [rB, rA]

        for col in cols_sorted:
            for rn in rack_order:
                items_at_col = [it for it in grouped.get(rn, []) if it.get("col") == col]
                # If more than one item in same rack&col, keep insertion order or sort by name
                for it in items_at_col:
                    name = it.get("name", "unknown")
                    rack = it.get("rack", "")
                    c = it.get("col", "")
                    optimized_order.append(f"{name} ({rack}c{c})")

        # move to next pair
        pair_start += 2

    return {"optimized_path": optimized_order}
