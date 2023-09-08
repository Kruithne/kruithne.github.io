import { parse } from 'node-html-parser';

const text = await Bun.file('data.txt').text();
const lines = text.split(/\r?\n/);

const lines_out = [];
const inventory = new Map<string, string>();
const included = new Set<string>();
let minifigure_count = 0;
let parsing_inventory = false;
let is_complete_set = false;

for (const line of lines) {
	if (parsing_inventory && (line.startsWith('// ') || line.trim().length === 0)) {
		parsing_inventory = false;
		for (const [key, value] of inventory) {
			if (!included.has(key)) {
				lines_out.push(key + '\t' + value + (is_complete_set ? '' : '\t' + 'MISSING'));
				included.add(key);
			}
		}
		inventory.clear();
		is_complete_set = false;
	}

	// Skip empty lines.
	if (line.trim().length === 0) {
		lines_out.push('');
		continue;
	}

	if (line.startsWith('// ')) {
		parsing_inventory = true;
		const parts = line.substring(3).split('\t');
		if (parts.length > 1 && parts[1] === 'COMPLETE') {
			parts.splice(1, 1);
			is_complete_set = true;
		}

		if (parts.length === 1) {
			const url = `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${parts[0]}`;
			console.log('No name for %s, fetching from %s', parts[0], url);

			const res = await fetch(url);

			if (res.status !== 200) {
				console.log('Failed to fetch %s', url);
				lines_out.push(line);
				continue;
			}

			const html = await res.text();

			// Use parse to get the name from the #item-name-title element.
			const root = parse(html);
			const name = root.querySelector('#item-name-title')?.text;

			if (name) {
				parts.push(name);
				console.log('Found name: %s', name);
			} else {
				console.log('Failed to get name for %s', parts[0]);
			}

			lines_out.push('// ' + parts.join('\t'));

			let inventory_url = null;
			const strong_elements = root.querySelectorAll('strong');
			for (const strong of strong_elements) {
				if (strong.text === 'Item Consists Of') {
					const parent = strong.parentNode;
					const links = parent.querySelectorAll('a');

					const inventories = new Map<string, string>();

					for (const link of links) {
						console.log('Found contents: %s', link.text);
						const matches = link.text.match(/\d+ (.*)/);
						if (matches)
							inventories.set(matches[1], link.attributes.href);
					}

					inventory_url = inventories.get('Minifigures') ?? inventories.get('Sets') ?? null;
					break;
				}
			}

			console.log('Inventory URL: %s', inventory_url);
			if (inventory_url !== null) {
				// Add query parameter v=0 to get list view.
				const inventory_url_list = inventory_url + '&v=0';
				const inventory_res = await fetch(inventory_url_list);

				if (inventory_res.status !== 200) {
					console.log('Failed to fetch %s', inventory_url_list);
					continue;
				}

				const inventory_html = await inventory_res.text();
				const inventory_root = parse(inventory_html);
				const inventory_items = inventory_root.querySelectorAll('.IV_ITEM');

				for (const inventory_item of inventory_items) {
					const td = inventory_item.childNodes[2];
					const item_id = td.childNodes[1].textContent;
					const item_name = inventory_item.childNodes[3].textContent;

					// TODO: Trim col24 from set names?
					// TODO: Trim (Complete Set with Stand and Accessories) from names?

					console.log({ item_id, item_name });
					inventory.set(item_id, item_name);
				}
			}
		}

		// https://www.bricklink.com/catalogItemInv.asp?S=71037-2&v=0&bt=0&sortBy=0&sortAsc=A&viewItemType=S
	} else {
		if (parsing_inventory) {
			minifigure_count++;
			const parts = line.split('\t');
			if (parts.length === 1) {
				// Get name from inventory.
				const name = inventory.get(parts[0]);
				if (name) {
					parts.push(name);
					console.log('Found name: %s', name);
				} else {
					console.log('Failed to get name for %s', parts[0]);
				}

				lines_out.push(parts.join('\t'));
			} else {
				included.add(parts[0]);
			}
		} else {
			lines_out.push(line);
		}
	}
}

if (parsing_inventory) {
	parsing_inventory = false;
	for (const [key, value] of inventory) {
		if (!included.has(key)) {
			lines_out.push(key + '\t' + value + (is_complete_set ? '' : '\t' + 'MISSING'));
			included.add(key);
		}
	}
	inventory.clear();
	is_complete_set = false;
}

await Bun.write('data.txt', lines_out.join('\n'));

let html = '<html>\n';
html += '\t<head>\n';
html += '\t\t<link rel="stylesheet" href="style.css">\n';
html += '\t</head>\n';
html += '\t<body>\n';
html += '\t\t<h1>Total Minifigures: ' + minifigure_count + '</h1>\n';

let table_open = false;

for (const line of lines_out) {
	// If line starts with //, start a new table.
	if (line.startsWith('// ')) {
		if (table_open) {
			html += '\t\t</table>\n';
			table_open = false;
		}

		html += '\t\t<table>\n';
		table_open = true;

		const parts = line.substring(3).split('\t');
		html += '\t\t\t<tr>\n';
		html += '\t\t\t\t<th><a href="https://www.bricklink.com/v2/catalog/catalogitem.page?S=' + parts[0] + '">' + parts[0] + '</a></th>\n';
		html += '\t\t\t\t<th>' + parts[1] + '</th>\n';
		html += '\t\t\t</tr>\n';
	} else {
		if (line.trim().length === 0)
			continue;
		const parts = line.split('\t');
		html += '\t\t\t<tr' + (parts.length === 3 ? ' class="missing"' : '') + '>\n';
		html += '\t\t\t\t<td><a href="https://www.bricklink.com/v2/catalog/catalogitem.page?S=' + parts[0] + '">' + parts[0] + '</a></td>\n';
		html += '\t\t\t\t<td>' + parts[1] ?? '' + '</td>\n';
		html += '\t\t\t</tr>\n';
	}
}

if (table_open) {
	html += '\t\t</table>\n';
	table_open = false;
}

html += '\t</body>\n';
html += '</html>\n';

await Bun.write('index.html', html);