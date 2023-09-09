This repository is used for personal tracking of my LEGO minifigure collection - that's it! The below documentation is for my own reference, because I'll probably forget.

## Usage
Tracked items in `data.txt` are entered one line at a time. Empty lines (blank or containing only whitespace) are ignored. Within a line, columns are separated by tabs.

Lines beginning with `#` are considered category headers.
```
# MINIFIGURE SERIES
...
```

To add a tracked set to the data, add a line with the BrickLink set ID, such as 30588-1.

```
// 30588-1
```

If all items in the set should be considered completed, add `COMPLETED` in the second column.

```
// 30588-1	COMPLETED
```

When changes to the data file are commit to the repository, the workflow will automatically search for sets that need to be inventoried.

During this process, all items within a set are populated, as well as the name of the set.

```
// 30588-1	Kids' Playground polybag
cty1333	Child - Girl, White Halter Top with Green Apples and Lime Spots, Medium Blue Short Legs, Dark Brown Hair with Buns, Freckles, Reddish Brown Backpack
cty1332	Skateboarder - Boy, Banana Shirt, Dark Azure Helmet, Backpack, Medium Blue Short Legs
```

To add a partially completed set, add the IDs of the minifigures that have been completed.

```
// 71028-2
colhp2-8
colhp2-11
```

In the above example, this marks `colhp2-8` and `colhp2-11` as completed, but not the rest of the minifigures in the set.

To mark a minifigure as missing, add the #MISSING to the last column. This is done automatically when adding sets, but can be edited manually.

```
// 60347-1	Grocery Store
cty1480	Mr. Produce	#MISSING
```

Additionally, notes can be added to the final column, such as marking missing pieces. An entry with a note will render orange in the final table.

```
// 7279-1	Police Minifigure Collection
cty0201	Police - Jail Prisoner Jacket over Prison Stripes, Dark Bluish Gray Legs, Dark Bluish Gray Knit Cap, Gold Tooth, Backpack	Missing part 92590
```