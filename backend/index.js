var mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path')

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
            INSERT INTO student (image, name, tel, adress, formation, level, matiere, parent_name, parent_tel, peyment_state, created_at, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(),0, ?)
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
            INSERT INTO student (image, name, tel, adress, formation, level, matiere, parent_name, parent_tel, created_at, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
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
    const { state , studentId } = req.body;
    const sql = `
        UPDATE student SET peyment_state = ? WHERE id_student = ?

    `;

    con.query(sql, [ !state,studentId], function (err, result) {
        if (err) {
            console.error('Error Deleting data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('Student paid successfully');
        res.status(200).json({ message: 'Student deleted successfully' });
    });
});
// Handle paid student....................................................................................





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


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
