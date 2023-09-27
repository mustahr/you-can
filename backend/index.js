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
    const sql = `
    SELECT s.*, c.*
    FROM student s
    LEFT JOIN student_class_relation scr ON s.id_student = scr.StudentID
    LEFT JOIN class c ON scr.ClassID = c.classID
`;
    con.query(sql, function (err, result) {
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
    const selectedClassIds = JSON.parse(req.body.selectedClasses); // Parse the selectedClassIds JSON string

    /* The code snippet `if (req.file) { ... }` is checking if a file was uploaded in the request. */
    if (req.file) {
        // If a file was uploaded, use its filename
        imageFileName = req.file.filename;
        const insertStudentSql = `
        INSERT INTO student (image, name, tel, adress, parent_name, parent_tel, peyment_state, archived, created_at, started_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW(), ?)
    `;

        // Insert the student data
        con.query(
            insertStudentSql,
            [imageFileName, fullName, phoneNumber, address, parentFullName, parentPhoneNumber, ''],
            function (err, result) {
                if (err) {
                    console.error('Error adding student data:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                const studentId = result.insertId; // Get the ID of the newly inserted student

                // Insert the selected class IDs into the student_class_relation table
                const insertRelationSql = `
                INSERT INTO student_class_relation (StudentID, ClassID)
                VALUES (?, ?)
            `;

                for (const classId of selectedClassIds) {
                    con.query(insertRelationSql, [studentId, classId], function (err, result) {
                        if (err) {
                            console.error('Error adding student-class relation:', err);
                            res.status(500).json({ error: 'Internal Server Error' });
                            return;
                        }
                    });
                }

                console.log('Student data added successfully');
                res.status(200).json({ message: 'Student added successfully' });
            }
        );
    } else {
        const sql = `
            INSERT INTO student (image, name, tel, adress, parent_name, parent_tel, peyment_state, archived, created_at, started_at)
            VALUES ('',?, ?, ?, ?, ?, 0, 0, NOW(), ?)
        `;

        con.query(sql, [fullName, phoneNumber, address, parentFullName, parentPhoneNumber, ''], function (err, result) {
            if (err) {
                console.error('Error adding data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const studentId = result.insertId; // Get the ID of the newly inserted student

            // Insert the selected class IDs into the student_class_relation table
            const insertRelationSql = `
            INSERT INTO student_class_relation (StudentID, ClassID)
            VALUES (?, ?)
        `;

            for (const classId of selectedClassIds) {
                con.query(insertRelationSql, [studentId, classId], function (err, result) {
                    if (err) {
                        console.error('Error adding student-class relation:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }
                });
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

        res.status(200).json({ message: 'Student paid successfully' });
    });
    console.log('Student set to not paid');
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
    const { idStudent, fullName, phoneNumber, address, parentFullName, parentPhoneNumber } = req.body;
    let imageFileName = null;
    const selectedClassIds = JSON.parse(req.body.selectedClasses); // Parse the selectedClassIds JSON string

    /* The code snippet `if (req.file) { ... }` is checking if a file was uploaded in the request. */
    if (req.file) {
        // If a file was uploaded, use its filename
        imageFileName = req.file.filename;
        const sql = `
        UPDATE student
        SET image = ?, name = ?, tel = ?, adress = ?, parent_name = ?, parent_tel = ?
        WHERE id_student = ?
    `;


        // Clear existing student-class relations for the given student ID
        const clearRelationsSql = `
        DELETE FROM student_class_relation
        WHERE StudentID = ?
    `;

        con.query(clearRelationsSql, [idStudent], function (err, result) {
            if (err) {
                console.error('Error clearing student-class relations:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Update the student data
            con.query(
                sql,
                [imageFileName, fullName, phoneNumber, address, parentFullName, parentPhoneNumber, idStudent],
                function (err, result) {
                    if (err) {
                        console.error('Error updating data:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }

                    console.log('Student updated successfully');

                    // Insert the selected class IDs into the student_class_relation table
                    const insertRelationSql = `
                    INSERT INTO student_class_relation (StudentID, ClassID)
                    VALUES (?, ?)
                `;

                    for (const classId of selectedClassIds) {
                        con.query(insertRelationSql, [idStudent, classId], function (err, result) {
                            if (err) {
                                console.error('Error adding student-class relation:', err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                return;
                            }
                        });
                    }

                    console.log('Student-class relations added successfully');
                    res.status(200).json({ message: 'Student updated successfully' });
                }
            );
        });
    } else {
        const sql = `
        UPDATE student
        SET name = ?, tel = ?, adress = ?, parent_name = ?, parent_tel = ?
        WHERE id_student = ?
    `;


        // Clear existing student-class relations for the given student ID
        const clearRelationsSql = `
        DELETE FROM student_class_relation
        WHERE StudentID = ?
    `;

        con.query(clearRelationsSql, [idStudent], function (err, result) {
            if (err) {
                console.error('Error clearing student-class relations:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Update the student data
            con.query(
                sql,
                [fullName, phoneNumber, address, parentFullName, parentPhoneNumber, idStudent],
                function (err, result) {
                    if (err) {
                        console.error('Error updating data:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }

                    console.log('Student updated successfully');

                    // Insert the selected class IDs into the student_class_relation table
                    const insertRelationSql = `
                    INSERT INTO student_class_relation (StudentID, ClassID)
                    VALUES (?, ?)
                `;

                    for (const classId of selectedClassIds) {
                        con.query(insertRelationSql, [idStudent, classId], function (err, result) {
                            if (err) {
                                console.error('Error adding student-class relation:', err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                return;
                            }
                        });
                    }

                    console.log('Student-class relations added successfully');
                    res.status(200).json({ message: 'Student updated successfully' });
                }
            );
        });
    }
});
// Edit student from students table....................................................................................



// pdf..............................................
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
            ['- Class                           :   ', studentData.class],
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

        doc.fontSize(8).text(`                              Totale : ${studentData.montant} DH`);


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



// pdf generator........................................................


// API route to generate and download Excel file............................
app.get('/api/downloadExcel', async (req, res) => {
    try {
        // Query your MySQL database to fetch student data
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM student');
        connection.release();

        // Convert the data to an Excel worksheet
        const ws = xlsx.utils.json_to_sheet(rows);

        // Create an Excel workbook
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Student Data');

        // Generate a buffer containing the Excel file
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set the response headers to trigger the download
        res.setHeader('Content-Disposition', 'attachment; filename=student_data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.end(buffer);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).end('Internal Server Error');
    }
});

// API route to generate and download Excel file............................



// Prof ............................................................

// Select prof from database

app.get('/api/Prof', (req, res) => {
    const sql = `
    SELECT p.*, c.*
    FROM prof p
    LEFT JOIN prof_class_relation scr ON p.idProf = scr.ProfID
    LEFT JOIN class c ON scr.ClassID = c.classID
`;
    con.query(sql, function (err, result) {
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

// Delete prof from  table....................................................................................
app.post('/api/deleteProf', async (req, res) => {
    const { ProfID } = req.body;
    const sql = `
        DELETE FROM prof WHERE idProf = ? 
    `;

    con.query(sql, [ProfID], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Prof deleted successfully');
        res.status(200).json({ message: 'Prof deleted successfully' });
    });
});
// Delete prof from  table....................................................................................

// Add Prof to database....................................................................................
app.post('/api/addProf', async (req, res) => {
    const { Name, Tele, Email, Formation, Level, Subject } = req.body;
    const selectedClassIds = JSON.parse(req.body.selectedClasses); // Parse the selectedClassIds JSON string

    const sql = `
    INSERT INTO prof (name, tele, email, created_at)
    VALUES (?, ?, ?, NOW())
    `;

    con.query(sql, [Name, Tele, Email, Formation, Level, Subject], function (err, result) {
        if (err) {
            console.error('Error adding data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const studentId = result.insertId; // Get the ID of the newly inserted student

        // Insert the selected class IDs into the student_class_relation table
        const insertRelationSql = `
        INSERT INTO prof_class_relation (ProfID, ClassID)
        VALUES (?, ?)
    `;

        for (const classId of selectedClassIds) {
            con.query(insertRelationSql, [studentId, classId], function (err, result) {
                if (err) {
                    console.error('Error adding prof-class relation:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
            });
        }

        console.log('Data added successfully');
        res.status(200).json({ message: 'Data added successfully' });
    });

});
// Add Prof to database....................................................................................


// Edit prof table....................................................................................

app.use(express.json());
app.post('/api/editProf', async (req, res) => {
    const { id_Prof, name, tele, email } = req.body;
    const selectedClassIds = JSON.parse(req.body.selectedClasses); // Parse the selectedClassIds JSON string

    const sql = `
            UPDATE prof
            SET name = ?, tele = ?, email = ?
            WHERE idProf = ?
            `;

    // Clear existing student-class relations for the given student ID
    const clearRelationsSql = `
        DELETE FROM prof_class_relation
        WHERE ProfID = ?
    `;

    try {
        // Clear existing relations
        await new Promise((resolve, reject) => {
            con.query(clearRelationsSql, [id_Prof], (err, result) => {
                if (err) {
                    console.error('Error clearing relations:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Update the prof data
        await new Promise((resolve, reject) => {
            con.query(sql, [name, tele, email, id_Prof], (err, result) => {
                if (err) {
                    console.error('Error updating prof data:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Insert the selected class IDs into the prof_class_relation table
        const insertRelationSql = `
            INSERT INTO prof_class_relation (ProfID, ClassID)
            VALUES (?, ?)
        `;

        for (const classId of selectedClassIds) {
            await new Promise((resolve, reject) => {
                con.query(insertRelationSql, [id_Prof, classId], (err, result) => {
                    if (err) {
                        console.error('Error adding prof-class relation:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }

        console.log('Prof updated successfully');
        res.status(200).json({ message: 'Prof updated successfully' });
    } catch (error) {
        console.error('Error in updating prof:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Edit prof table....................................................................................







// CLASSES ............................................................

// Select Class from database

app.get('/api/Class', (req, res) => {
    con.query("SELECT * FROM class ", function (err, result) {
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

// Delete prof from  table....................................................................................
app.post('/api/deleteClass', async (req, res) => {
    const { ClassID } = req.body;
    const sql = `
        DELETE FROM class WHERE classID = ? 
    `;

    con.query(sql, [ClassID], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Class deleted successfully');
        res.status(200).json({ message: 'Class deleted successfully' });
    });
});
// Delete prof from  table....................................................................................
// Add Class to database....................................................................................
app.post('/api/addClass', async (req, res) => {
    const { Name, Formation, Level, Subject } = req.body;
    const sql = `
    INSERT INTO class (className, formation, level, subject)
    VALUES (?, ?, ?, ?)
    `;

    con.query(sql, [Name, Formation, Level, Subject], function (err, result) {
        if (err) {
            console.error('Error adding class:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Class added successfully');
        res.status(200).json({ message: 'Class added successfully' });
    });

});
// Add Class to database....................................................................................
// Edit classes table....................................................................................

app.use(express.json());
app.post('/api/editClass', async (req, res) => {
    const { classID, Name, Formation, Level, Subject } = req.body;
    const sql = `
            UPDATE class
            SET className = ?, formation = ?, level = ?, subject = ?
            WHERE classID = ?
            `;

    try {

        // Update the prof data
        await new Promise((resolve, reject) => {
            con.query(sql, [Name, Formation, Level, Subject, classID], (err, result) => {
                if (err) {
                    console.error('Error updating class data:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });


        console.log('class updated successfully');
        res.status(200).json({ message: 'class updated successfully' });
    } catch (error) {
        console.error('Error in updating class:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Edit class table....................................................................................
// Schedule...................................................................................
app.get('/api/getSchedule', (req, res) => {
    const classID = req.query.classID;

    let sql;
    if (classID === '0') {
        // If classID is null or undefined, select all records
        sql = "SELECT * FROM class_schedule";
    } else {
        // If classID is provided, filter by class_id
        sql = "SELECT * FROM class_schedule WHERE class_id = ?";
    }
    con.query(sql, [classID], function (err, result) {
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

// Add Class Schedule to database....................................................................................
app.post('/api/addClassSchedule', async (req, res) => {

    const { selectedClasse, day_of_week, start_time, end_time } = req.body;
    const sql = `
    INSERT INTO class_schedule (class_id , day_of_week, start_time, end_time)
    VALUES (?, ?, ?, ?)
    `;

    con.query(sql, [selectedClasse, day_of_week, start_time, end_time], function (err, result) {
        if (err) {
            console.error('Error adding class:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Class Schedule added successfully');
        res.status(200).json({ message: 'Class Sechdule added successfully' });
    });

});
// Add Class Schedule to database....................................................................................

// Delete Class from  table....................................................................................
app.post('/api/deleteClassSchedule', async (req, res) => {
    const { ClassID } = req.body;
    const sql = `
        DELETE FROM class_schedule WHERE class_schedule_id = ? 
    `;

    con.query(sql, [ClassID], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Class Schedule deleted successfully');
        res.status(200).json({ message: 'Class Schedule deleted successfully' });
    });
});


// Bank....................................
// Select Bank from database

app.get('/api/Bank', (req, res) => {
    con.query("SELECT * FROM bank ", function (err, result) {
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
// Add Operation Bank to database....................................................................................
app.post('/api/addBank', async (req, res) => {

    const { description, total, type } = req.body;
    const sql = `
    INSERT INTO bank (date , description,total, type)
    VALUES (NOW(), ?, ?, ?)
    `;

    con.query(sql, [description, total, type], function (err, result) {
        if (err) {
            console.error('Error adding bank operation:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('bank operation added successfully');
        res.status(200).json({ message: 'bank operation added successfully' });
    });

});



// Absence .........................................................
app.get('/api/absentStudents', (req, res) => {
    const { date, classId } = req.query; // Use req.query to access query parameters
    console.log('Received request with data:', req.query);

    // If classID is provided, filter by class_id
    let sql = "SELECT * FROM absence WHERE classID = ? AND date = ?";
    console.log('SQL Query:', sql); // Log the SQL query

    con.query(sql, [classId, date], function (err, result) {
        console.log('result : ', result); // Log the SQL query

        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        if (result.length > 0) {
            const absentStudentIds = result.map((row) => row.studentID);
            console.log('Absent Student IDs:', absentStudentIds); // Log the absent student IDs

            // Now, fetch the names of absent students from the 'students' table
            let studentNamesSql = "SELECT id_student, name FROM student WHERE id_student IN (?)";

            con.query(studentNamesSql, [absentStudentIds], function (err, studentNamesResult) {
                if (err) {
                    console.error('Error fetching student names:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                // Create an object to store absent student names
                const absentStudentNames = {};

                // Loop through the student names result and group names by student ID
                studentNamesResult.forEach((row) => {
                    const studentID = row.id_student;
                    const studentName = row.name;

                    // Check if the student ID already exists in the object
                    if (absentStudentNames[studentID]) {
                        // If it exists, push the name to the existing array
                        absentStudentNames[studentID].push(studentName);
                    } else {
                        // If it doesn't exist, create a new array with the name
                        absentStudentNames[studentID] = [studentName];
                    }
                });

                console.log('Absent Student Names:', absentStudentNames); // Log the absent student names

                res.json(absentStudentNames);
            });
        } else {
            res.json({ message: 'No data available' });
        }
    });
});



// Absence featrue for prof
app.get('/api/classes', (req, res) => {
    const professorID = req.query.professorID; // Get professorID from the query parameter
    console.log(professorID)
    // Perform a SQL JOIN query to fetch classes based on professorID
    const sql = `
      SELECT class.*
      FROM class
      JOIN prof_class_relation ON class.classID = prof_class_relation.ClassID
      WHERE prof_class_relation.ProfID = ?
    `;
    con.query(sql, [professorID], (err, result) => {
        if (err) {
            console.error('Error fetching classes:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(result);
        }
    });
});

app.get('/api/students', (req, res) => {
    const classID = req.query.classID; // Get classID from the query parameter

    // Perform a SQL JOIN query to fetch students based on classID
    const sql = `
      SELECT student.*
      FROM student
      JOIN student_class_relation ON student.id_student = student_class_relation.StudentID
      WHERE student_class_relation.ClassID = ?
    `;
    con.query(sql, [classID], (err, result) => {
        if (err) {
            console.error('Error fetching students:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(result);
        }
    });
});



const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
