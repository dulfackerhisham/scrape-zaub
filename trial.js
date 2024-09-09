const puppeteer = require('puppeteer');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        args: ['--start-maximized'],
    });
    const page = await browser.newPage();

    const lastPage = 13333;

    const csvWriter = createCsvWriter({
        path: path.join(__dirname, 'company_details.csv'),
        header: [
            { id: 'page', title: 'Page' },
            { id: 'link', title: 'Link' },
            { id: 'LLP_number', title: 'LLP Number' },
            { id: 'rowData', title: 'Row Data' },
            { id: 'firstPText', title: 'First Paragraph Text' },
            { id: 'lastPText', title: 'Last Paragraph Text' }
        ]
    });

    const records = [];

    for (let i = 1; i <= lastPage; i++) {
        await page.goto(`https://www.zaubacorp.com/company-list/p-${i}-company.html`, { timeout: 60000 });

        const links = await page.$$eval('tr > td > a', (anchorTag) => anchorTag.map((a) => a.href));
        console.log(`Page ${i} - Found ${links.length} links`);

        for (const link of links) {
            await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });

            try {
                const companyDetails = await page.$('.table-striped');
                
                if (companyDetails) {
                    const llpNum = await page.evaluate(() => {
                        const element = document.querySelector('.table-striped thead > tr > td:nth-child(2) > p');
                        return element ? element.innerText : 'Element not found';
                    });

                    const rowsData = await page.evaluate(() => {
                        const table = document.querySelector('.table-striped');
                        return Array.from(table.querySelectorAll('tbody tr')).map(row => {
                            // Get text from the 1st and 2nd <td> elements in each row
                            return [
                                row.querySelector('td:nth-child(1)') ? row.querySelector('td:nth-child(1)').innerText.trim() : 'Not found',
                                row.querySelector('td:nth-child(2)') ? row.querySelector('td:nth-child(2)').innerText.trim() : 'Not found'
                            ];
                        });
                    });

                    // Flatten the nested array structure into a single row
                    const flattenedRowData = rowsData.flat().join('; ');  // Convert array into a single string with ';' as a separator

                    // Extract text from the first and last <p> tags inside the specific div
                    const { firstPText, lastPText } = await page.evaluate(() => {
                        const pElements = Array.from(document.querySelectorAll('#block-system-main > div.contaier > div.container.information > div:nth-child(13) > div > div:nth-child(1) p'));
                        return {
                            firstPText: pElements.length > 0 ? pElements[0].innerText.trim() : 'Not found',
                            lastPText: pElements.length > 0 ? pElements[pElements.length - 1].innerText.trim() : 'Not found'
                        };
                    });

                    // Push a single row of data for each company
                    records.push({
                        page: i,
                        link: link,
                        LLP_number: llpNum,
                        rowData: flattenedRowData,  // Flattened row data goes here
                        firstPText: firstPText,
                        lastPText: lastPText
                    });
                } else {
                    console.log('Table not found on this page.');
                }
            } catch (error) {
                console.log('Error accessing or parsing page:', error);
            }
        }
    }

    await csvWriter.writeRecords(records);
    console.log('CSV file was written successfully');
    await browser.close();
}

run();
