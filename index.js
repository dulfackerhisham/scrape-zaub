// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra')
const fs = require('fs');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: true,
        // defaultViewport: null,
        // args: ['--start-maximized'],
        protocolTimeout: 120000, // Increase protocol timeout (2 minutes)
    });
    const page = await browser.newPage();

     // Set a user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');


    const lastPage = 82; // Adjust this as necessary

    let htmlContent = `
        <html>
        <head>
            <title>Company Details</title>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Company Details</h1>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>LLP Number</th>
                        <th>Company DETAILS</th>
                        <th>EMAIL</th>
                        <th>ADDRESS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let rowIndex = 2398; // To track row number

    for (let i = 82; i <= lastPage; i++) {
        await page.goto(`https://www.zaubacorp.com/company-list/p-${i}-company.html`, { timeout: 120000 }); // Increase navigation timeout

        const links = await page.$$eval('tr > td > a', (anchorTag) => anchorTag.map((a) => a.href));
        console.log(`Page ${i} - Found ${links.length} links`);

        for (const link of links) {
            try {
                await page.goto(link, { waitUntil: 'load', timeout: 120000 });

                const companyDetails = await page.$('.table-striped');
                if (companyDetails) {
                    const llpNum = await page.evaluate(() => {
                        const element = document.querySelector('.table-striped thead > tr > td:nth-child(2) > p');
                        return element ? element.innerText : 'Element not found';
                    });

                    const rowsData = await page.evaluate(() => {
                        const table = document.querySelector('.table-striped');
                        return Array.from(table.querySelectorAll('tbody tr')).map(row => {
                            return [
                                row.querySelector('td:nth-child(1)') ? `<b>${row.querySelector('td:nth-child(1)').innerText.trim()}</b>` : '<b>Not found</b>',
                                row.querySelector('td:nth-child(2)') ? `${row.querySelector('td:nth-child(2)').innerText.trim()}</b>` : '<b>Not found</b>'
                            ].join('<br>');
                        }).join('<br><br>');
                    });


                    const { firstPText, lastPText } = await page.evaluate(() => {
                        // Get the 3rd element with the specified class names
                        const elements = document.querySelectorAll('.col-lg-6.col-md-6.col-sm-12.col-xs-12');
                        if (elements.length >= 3) {
                            const thirdElement = elements[2];
                            // Extract <p> elements within the 3rd element
                            const pElements = Array.from(thirdElement.querySelectorAll('p'));
                            const firstPText = pElements.length > 0 ? pElements[0].innerText.trim() : 'Not found';
                            const lastPText = pElements.length > 0 ? pElements[pElements.length - 1].innerText.trim() : 'Not found';
                
                            return {
                                firstPText,
                                lastPText
                            };
                        } else {
                            return {
                                firstPText: 'NOTHING FOUND',
                                lastPText: 'NOTHING FOUND'
                            };
                        }
                    });

                    // Append the data for each company as a new table row with a row number
                    htmlContent += `
                        <tr>
                            <td>${rowIndex++}</td> <!-- Row number -->
                            <td>${llpNum}</td>
                            <td>${rowsData}</td>
                            <td>${firstPText}</td>
                            <td>${lastPText}</td>
                        </tr>
                    `;
                } else {
                    console.log('Table not found on this page.');
                }
            } catch (error) {
                console.log('Error accessing or parsing page:', error);
            }
        }
    }

    htmlContent += `
            </tbody>
        </table>
        </body>
        </html>
    `;

    // Save the HTML content to a file
    fs.writeFileSync(path.join(__dirname, 'company_details.html'), htmlContent);
    console.log('HTML file was written successfully');
    await browser.close();
}

run();
