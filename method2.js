const companyDetails = await page.evaluate(() => {
    // Get the table
    const table = document.querySelector('.table-striped');
    if (!table) return []; // Return empty array if table is not found
  
    // Get all rows in the table
    const rows = table.querySelectorAll('thead > tr');
    
    // Extract data from each row
    return Array.from(rows).map(row => {
      return {
        LLP_Identification_Number: row.querySelector('td:nth-child(2) > p') ? row.querySelector('thead > tr > td:nth-child(2) > p').innerText : 'Not found'
        // Add other fields as needed
      };
    });
  });