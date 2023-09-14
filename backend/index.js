var mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path')
const moment = require('moment');
const { CronJob } = require('cron');
const cron = require('cron');

const app = express();
app.use(cors());
app.use(express.static('public'));



var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "you_can"
});
con.connect(function (err) {
    if (err) throw err;
    console.log('Connected to the database'); // Log a message when connected
});
app.use(express.json());






// check paiment 
// Schedule a daily task to check and update payment status
const dailyJob = new cron.CronJob('0 0 * * *', () => {
    const currentDate = moment();

    // Query for students whose payment status is true
    const query = `
            SELECT * FROM student
            WHERE peyment_state = 1;
    `;

    con.query(query, (err, results) => {
        if (err) {
            console.error('Error querying students:', err);
        } else {
            results.forEach((student) => {
                const paymentDate = moment(student.started_at);
                const daysSincePayment = currentDate.diff(paymentDate, 'days');

                if (daysSincePayment >= 27) {
                    // Update payment status to false
                    const updateQuery = `
                UPDATE students
                SET peyment_state = 0
                WHERE id_student = ?;
            `;

                    con.query(updateQuery, [student.id_student], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating payment status:', updateErr);
                        } else {
                            console.log(`Updated payment status for student ID ${student.id_student}.`);
                        }
                    });
                }
            });
        }
    });
});

// Start the cron job
dailyJob.start();
// check paiment 







// Add pre inscription to database....................................................................................
app.post('/api/preInsription', async (req, res) => {
    const { name, tel } = req.body;
    const sql = `
    INSERT INTO pre_inscription (name, tele)
    VALUES (?, ?)
  `;

    con.query(sql, [name, tel], function (err, result) {
        if (err) {
            console.error('Error adding data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Data added successfully');
        res.status(200).json({ message: 'Data added successfully' });
    });

});
// Add pre inscription to database....................................................................................

// Select pre inscription from database....................................................................................
app.get('/api/ShowPreInsription', (req, res) => {
    con.query("SELECT * FROM pre_inscription ", function (err, result) {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        if (result.length > 0) {
            res.json(result); // Return the first record
            // console.log(result);
        } else {
            res.json({ message: 'No data available' });
        }
    });
});
// Select pre inscription from database....................................................................................

// Select pre students from database....................................................................................
app.get('/api/StudentsList', (req, res) => {
    con.query("SELECT * FROM student ", function (err, result) {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        if (result.length > 0) {
            res.json(result); // Return the first record
            // console.log(result);
        } else {
            res.json({ message: 'No data available' });
        }
    });
});
// Select pre students from database....................................................................................



// Route to fetch admin data from the database......................................................................................
// Test route to fetch and return a sample record from the database
app.get('/api/admin', (req, res) => {
    con.query("SELECT * FROM admin ", function (err, result) {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        if (result.length > 0) {
            res.json(result); // Return the first record
            // console.log(result);
        } else {
            res.json({ message: 'No data available' });
        }
    });
});
// Route to fetch admin data from the database......................................................................................

// Route to add a new product to the database.........................................................................................////
// Use express.json() middleware to parse JSON data
const storage = multer.diskStorage({
    destination: (res, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
});

app.use(express.json());

const upload = multer({
    storage: storage
}); // Specify the directory to temporarily store uploaded files

app.post('/api/addStudent', upload.single('image'), async (req, res) => {
    const { idStudent, fullName, phoneNumber, address, parentFullName, parentPhoneNumber, formationType, level, subject } = req.body;
    let imageFileName = null;

    /* The code snippet `if (req.file) { ... }` is checking if a file was uploaded in the request. */
    if (req.file) {
        // If a file was uploaded, use its filename
        imageFileName = req.file.filename;
        const sql = `
            INSERT INTO student (image, name, tel, adress, formation, level, matiere, parent_name, parent_tel, peyment_state, archived, created_at, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), ?)
        `;

        con.query(sql, [imageFileName, fullName, phoneNumber, address, formationType, level, subject, parentFullName, parentPhoneNumber, ''], function (err, result) {
            if (err) {
                console.error('Error adding data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            console.log('Student data added successfully');
            res.status(200).json({ message: 'Product added successfully' });
        });
    } else {
        const sql = `
            INSERT INTO student (image, name, tel, adress, formation, level, matiere, parent_name, parent_tel, peyment_state, archived, created_at, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, ?)
        `;

        con.query(sql, ['', fullName, phoneNumber, address, formationType, level, subject, parentFullName, parentPhoneNumber, ''], function (err, result) {
            if (err) {
                console.error('Error adding data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            console.log('Student data added successfully');
            res.status(200).json({ message: 'Student added successfully' });
        });
    }

    if (idStudent !== null) {
        // Deleting data from pre_inscription afte adding a student
        const sql = `
        DELETE FROM pre_inscription WHERE id_pre_inscription = ? 
        `;

        con.query(sql, [idStudent], function (err, result) {
            if (err) {
                console.error('Error Deleting data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
        });
    }

});
//// Route to add a new product to the database.........................................................................................////


// Delete Student from poducts table....................................................................................
app.post('/api/deleteStudent', async (req, res) => {
    const { studentId } = req.body;
    const sql = `
        DELETE FROM student WHERE id_student = ? 
    `;

    con.query(sql, [studentId], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Student deleted successfully');
        res.status(200).json({ message: 'Student deleted successfully' });
    });
});
// Delete Student from poducts table....................................................................................


// Handle paid student....................................................................................
app.post('/api/paidStudent', async (req, res) => {
    const { studentId } = req.body;
    const sql = `
        UPDATE student SET peyment_state = ? , started_at = NOW() WHERE id_student = ?
    `;

    con.query(sql, [1, studentId], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Student paid successfully');
        res.status(200).json({ message: 'Student did not paid' });
    });
});
// Handle paid student....................................................................................

// Handle automatic paid student....................................................................................
app.post('/api/autoPaidStudent', async (req, res) => {
    const { StudentID } = req.body;
    const state = 0;
    const sql = `
        UPDATE student SET peyment_state = ? WHERE id_student = ?
    `;

    con.query(sql, [state, StudentID], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Student set to not paid');
        res.status(200).json({ message: 'Student paid successfully' });
    });
});
// Handle automatic paid student....................................................................................



// Handle archeived student....................................................................................
app.post('/api/archiveStudent', async (req, res) => {
    const { state, studentId } = req.body;
    const sql = `
        UPDATE student SET archived = ? WHERE id_student = ?

    `;

    con.query(sql, [!state, studentId], function (err, result) {
        if (err) {
            console.error('Error archived student:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Student paid successfully');
        res.status(200).json({ message: 'Student archived successfully' });
    });
});
// Handle archeived student....................................................................................




//  Start Formation....................................................................................

app.use(express.json());
app.post('/api/startFormation', async (req, res) => {
    const { StudentID, StartDate } = req.body;
    const sql = `
                UPDATE student SET started_at = ? WHERE id_student = ?
            `;
    con.query(sql, [StartDate, StudentID], function (err, result) {
        if (err) {
            console.error('Error updating data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Starting date added successfully');
    });
});
// Start formation....................................................................................



// Edit student from students table....................................................................................

app.use(express.json());
app.post('/api/editStudent', upload.single('image'), async (req, res) => {
    const { idStudent, fullName, phoneNumber, address, parentFullName, parentPhoneNumber, formationType, level, subject } = req.body;
    let imageFileName = null;

    /* The code snippet `if (req.file) { ... }` is checking if a file was uploaded in the request. */
    if (req.file) {
        // If a file was uploaded, use its filename
        imageFileName = req.file.filename;
        const sql = `
            UPDATE student
            SET image = ?, name = ?, tel = ?, adress = ?, formation = ?, level = ?, matiere = ? , parent_name = ? , parent_tel = ? 
            WHERE id_student = ?
            `;
        con.query(sql, [imageFileName, fullName, phoneNumber, address, formationType, level, subject, parentFullName, parentPhoneNumber, idStudent], function (err, result) {
            if (err) {
                console.error('Error updating data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            console.log('Product updated successfully');
            res.status(200).json({ message: 'student updated successfully' });
        });
    } else {
        const sql = `
            UPDATE student
            SET name = ?, tel = ?, adress = ?, formation = ?, level = ?, matiere = ? , parent_name = ? , parent_tel = ? 
            WHERE id_student = ?
            `;
        con.query(sql, [fullName, phoneNumber, address, formationType, level, subject, parentFullName, parentPhoneNumber, idStudent], function (err, result) {
            if (err) {
                console.error('Error updating data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            console.log('Product updated successfully');
            res.status(200).json({ message: 'student updated successfully' });
        });
    }
});
// Edit student from students table....................................................................................
const PDFDocument = require('pdfkit');
const fs = require('fs');
app.post('/api/generate-pdf', (req, res) => {
    try {
        const studentData = req.body;

        const doc = new PDFDocument();
        // You can customize the file name and location here
        const filePath = 'student.pdf';


        // Set the Content-Disposition header to suggest the filename
        doc.info['Title'] = 'Student facteur';

        doc.pipe(fs.createWriteStream(filePath));



        // Add logo to the PDF


        // Construct the image path with the correct format and userImage value
        // const logoPath = `public/images/${studentData.userImage}`;
        const logoPath = `public/logo/logo.JPG`;

        doc.image(logoPath, 15, 15, { width: 70 }); // Adjust the coordinates and width as needed

        // Center the text horizontally and vertically
        doc.font('Times-Roman').fontSize(15).text('Reçu', {
            align: 'center',
            underline: { color: 'blue', thickness: 2 }, // Customize underline color and thickness
        })

        doc.moveDown(1); // Move down by 1 line

        const tableData = [
            ['- Nom et Prénom          :   ', studentData.name],
            ['- Type de Formation     :   ', studentData.formation],
            ['- Niveau                        :   ', studentData.level],
            ['- Matièrs                       :   ', studentData.subject],
        ];

        const labelWidth = 350; // Adjust the label width as needed

        tableData.forEach(([label, value]) => {
            doc.fontSize(11).font('Times-Roman').text(label, { width: labelWidth, continued: true }).font('Helvetica').text(value, { align: 'left', width: 400 });
        });

        doc.moveDown(1); // Move down by 1 line
        doc.font('Times-Roman').fontSize(8).text(`Date de paiment : ${studentData.date}`,
            {
                align: 'left',
                continued: true,
            });


        if (studentData.montant !== studentData.avance && studentData.avance !== "" && !isNaN(studentData.avance) && studentData.avance !== 0) {
            doc.fontSize(8).text(`                              Totale : ${studentData.montant} DH`,
                {
                    continued: true,
                });          // Calculate the "Rest" value as montant - avance
            doc.fontSize(8).text(`                           Avance : ${studentData.avance} DH`,
                {
                    continued: true,
                });
            const rest = studentData.montant - studentData.avance;
            doc.fontSize(8).text(`                            Rest : ${rest}  DH`);
        } else {
            doc.fontSize(8).text(`                              Totale : ${studentData.montant} DH`);
        }

        // Add space at the bottom for your signature
        doc.moveDown(3); // Move down by 3 lines
        doc.font('public/font/Brisbane.ttf').fontSize(7)
            .text('NB, Une fois le tarif payé, il ne sura dans aucun cas annulé.',
                {
                    align: 'center',
                })
            .text('Quelques soit les ciconstances le centre n\'assurance pas le rembourcement a bénéficiatre. ',
                {
                    align: 'center',
                })
        doc.end();

        // Send the generated PDF as a response
        res.sendFile(filePath, { root: __dirname }, (err) => {
            if (err) {
                console.error('Error sending the PDF:', err);
                res.status(500).send('Error sending the PDF');
            } else {
                console.log('PDF generation and display successful');
            }
        });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('PDF generation failed');
    }
});



// pdf generator






const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
