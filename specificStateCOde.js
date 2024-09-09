const links = await page.$$eval('tr', rows => {
    return Array.from(rows)
        .filter(row => {
            // Get the text content of the 3rd <td> (if it exists)
            const thirdTd = row.querySelector('td:nth-child(3)');
            return thirdTd && thirdTd.innerText.includes('DELHI'); // Filter rows with 'DELHI' in the 3rd <td>
        })
        .map(row => {
            // Get the link from the <a> tag in the 1st <td> of the filtered row
            const anchorTag = row.querySelector('td > a');
            return anchorTag ? anchorTag.href : null;
        })
        .filter(link => link); // Remove any null values if no <a> tag was found
});

console.log(`Page ${i} - Found ${links.length} links with 'DELHI' in the third <td>`);


// all company
// const links = await page.$$eval('tr > td > a', (anchorTag) => anchorTag.map((a) => a.href));
// console.log(`Page ${i} - Found ${links.length} links`);