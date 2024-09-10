// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra')
const fs = require('fs');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox',
            '--disable-setuid-sandbox',
           '--disable-dev-shm-usage',
           '--disable-gpu',
           '--single-process',
           '--no-zygote',
           '--disable-web-security',
           ],
           executablePath: '/usr/bin/chromium-browser',   
        protocolTimeout: 120000, // Increase protocol timeout (2 minutes)
    });
    const page = await browser.newPage();

     // Set a user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');


    const lastPage = 1; // Adjust this as necessary

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
                        <th>COMPANY DETAILS</th>
                        <th>DIRECTOR DETAILS</th>
                        <th>EMAIL</th>
                        <th>ADDRESS</th>
                        <th>SHARE CAPITAL</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let rowIndex = 1; // To track row number

    for (let i = 1; i <= lastPage; i++) {
        await page.goto(`https://www.zaubacorp.com/company-list/p-${i}-company.html`, { timeout: 120000 }); // Increase navigation timeout

        const links = await page.$$eval('tr', rows => {
            return Array.from(rows)
                .filter(row => {
                    // Get the text content of the 3rd <td> (if it exists)
                    const thirdTd = row.querySelector('td:nth-child(3)');
                    return thirdTd && thirdTd.innerText.includes('Pune'); // Filter rows with 'DELHI' in the 3rd <td>
                })
                .map(row => {
                    // Get the link from the <a> tag in the 1st <td> of the filtered row
                    const anchorTag = row.querySelector('td > a');
                    return anchorTag ? anchorTag.href : null;
                })
                .filter(link => link); // Remove any null values if no <a> tag was found
        });
        
        console.log(`Page ${i} - Found ${links.length} links with 'Mumbai' in the third <td>`);

        for (const link of links) {
            try {
                await page.goto(link, { waitUntil: 'load', timeout: 120000 });
                console.log('entered the link');
                
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
                                firstPText: 'No Data Found',
                                lastPText: 'No Data Found'
                            };
                        }
                    });

                    const shareCapitals = await page.evaluate(() => {
                        // Select all elements with the specific class name
                        const elements = document.querySelectorAll('.col-lg-12.col-md-12.col-sm-12.col-xs-12');
                    
                        if (elements.length >= 4) {
                            // Get the fourth element
                            const fourthElement = elements[3];
                    
                            // Find the tbody within the fourth element
                            const tbody = fourthElement.querySelector('tbody');
                    
                            if (tbody) {
                                // Get all <tr> elements within the tbody
                                const rows = tbody.querySelectorAll('tr');
                    
                                // Convert NodeList to array and exclude the last <tr> element
                                const rowsArray = Array.from(rows);
                                const rowsToProcess = rowsArray.slice(0, -1);
                    
                                // Extract data from each remaining <tr> element
                                return rowsToProcess.map(row => {
                                    // Extract text from each <td> within the row
                                    return Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim()).join(' | ');
                                }).join('<br>');
                            } else {
                                return 'No tbody found';
                            }
                        } else {
                            return 'Element not found';
                        }
                    });
                    

                    const DirectorDetails =  await page.evaluate(() => {
                        const elements = document.querySelectorAll('.col-lg-12.col-md-12.col-sm-12.col-xs-12');
                        if (elements.length >= 7) {
                            const seventhElement = elements[6];
                            // Select all elements with the class "accordion-toggle main-row" within the 7th element
                            const targetRows = seventhElement.querySelectorAll('.accordion-toggle.main-row');

                            // Extract data from each <tr> element
                            return Array.from(targetRows).map(row => {
                                const pElements = Array.from(row.querySelectorAll('p'));
                                return pElements.slice(0, -1).map(p => p.innerText.trim()).join('<br>');
                            }).join('<br><br>');
                        } else {
                            return 'Director Details Not Found'
                        }
                    });



                    // Append the data for each company as a new table row with a row number
                    htmlContent += `
                        <tr>
                            <td>${rowIndex++}</td> <!-- Row number -->
                            <td>${llpNum}</td>
                            <td>${rowsData}</td>
                            <td>${DirectorDetails}</td>
                            <td>${firstPText}</td>
                            <td>${lastPText}</td>
                            <td>${shareCapitals}</td>
                        </tr>
                    `;
                    console.log('scraped data');

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
