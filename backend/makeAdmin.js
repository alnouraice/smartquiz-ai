const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const email = process.argv[2] && process.argv[2].trim();

if (!email) {
  console.error('Usage: node makeAdmin.js <email>');
  process.exitCode = 1;
} else {
  const databasePath = path.join(__dirname, 'data', 'smartquiz.sqlite');
  const database = new sqlite3.Database(databasePath, (openError) => {
    if (openError) {
      console.error('Could not open the SQLite database:', openError.message);
      process.exitCode = 1;
      return;
    }

    database.run(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', email],
      function onUpdate(updateError) {
        if (updateError) {
          console.error('Could not update the account role:', updateError.message);
          process.exitCode = 1;
        } else if (this.changes === 0) {
          console.error(`No account found for ${email}.`);
          process.exitCode = 1;
        } else {
          console.log(`Successfully set ${email} to admin.`);
        }

        database.close((closeError) => {
          if (closeError) {
            console.error('Could not close the SQLite database:', closeError.message);
            process.exitCode = 1;
          }
        });
      }
    );
  });
}
