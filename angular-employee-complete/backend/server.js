const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// สร้างแอปพลิเคชัน Express
const app = express();

// เปิดใช้งาน CORS เพื่อให้ API สามารถเข้าถึงได้จากแอป Angular
app.use(cors());

// ให้ Express รองรับการส่งข้อมูลแบบ JSON
app.use(express.json());

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // ชื่อผู้ใช้ MySQL
  password: 'root', // รหัสผ่าน MySQL
  database: 'employees' // ชื่อฐานข้อมูลที่คุณใช้
});

// เช็คการเชื่อมต่อกับ MySQL
connection.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

// API สำหรับดึงข้อมูลพนักงานทั้งหมด (GET)
app.get('/employees', (req, res) => {
  const query = 'SELECT * FROM employees'; // ดึงข้อมูลทั้งหมดจากตาราง employees
  connection.execute(query, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ message: 'Error fetching employees', error: err });
    }
    res.status(200).json({ employees: results }); // ส่งข้อมูลกลับในรูป JSON
  });
});

// API สำหรับเพิ่มข้อมูลพนักงาน (POST)
app.post('/employees', (req, res) => {
  const employee = req.body;

  // ตรวจสอบข้อมูลที่ได้รับจาก client
  if (!employee.firstName || !employee.lastName || !employee.email || !employee.dob) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // แปลงวันที่ 'dob' ให้เป็นรูปแบบที่ MySQL รองรับ
  const dob = new Date(employee.dob);
  if (isNaN(dob)) {
    return res.status(400).json({ message: 'Invalid date of birth' });
  }

  const formattedDob = dob.toISOString().slice(0, 19).replace('T', ' ');

  // คำสั่ง SQL สำหรับการเพิ่มข้อมูล (ไม่ต้องใส่ id เพราะใช้ AUTO_INCREMENT)
  const query = `INSERT INTO employees (firstName, lastName, email, dob, gender, education, department, position, salary)  
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`; // แก้ชื่อคอลัมน์ 'position' แทน 'positione'

  const values = [
    employee.firstName,
    employee.lastName,
    employee.email,
    formattedDob, // ใช้ค่าที่แปลงแล้ว
    employee.gender || '',
    employee.education || '',
    employee.department || '',
    employee.position || '',
    employee.salary || 0
  ];

  // ใช้ MySQL2 เพื่อ execute คำสั่ง SQL
  connection.execute(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Error saving employee', error: err });
    }
    res.status(201).json({ message: 'Employee added successfully', results });
  });
});

// API สำหรับอัพเดตข้อมูลพนักงาน (PUT)
app.put('/employees/:id', (req, res) => {
  const employeeId = req.params.id;
  const employee = req.body;

  // ตรวจสอบข้อมูลที่ได้รับจาก client
  if (!employee.firstName || !employee.lastName || !employee.email || !employee.dob) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // แปลงวันที่ 'dob' ให้เป็นรูปแบบที่ MySQL รองรับ
  const dob = new Date(employee.dob);
  if (isNaN(dob)) {
    return res.status(400).json({ message: 'Invalid date of birth' });
  }

  const formattedDob = dob.toISOString().slice(0, 19).replace('T', ' ');

  // คำสั่ง SQL สำหรับการอัพเดตข้อมูลพนักงาน
  const query = `UPDATE employees SET firstName = ?, lastName = ?, email = ?, dob = ?, gender = ?, education = ?, department = ?, position = ?, salary = ? 
                 WHERE id = ?`;

  const values = [
    employee.firstName,
    employee.lastName,
    employee.email,
    formattedDob,
    employee.gender || '',
    employee.education || '',
    employee.department || '',
    employee.position || '',
    employee.salary || 0,
    employeeId // ID ของพนักงานที่ต้องการอัพเดต
  ];

  // ใช้ MySQL2 เพื่อ execute คำสั่ง SQL
  connection.execute(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Error updating employee', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee updated successfully', results });
  });
});

// API สำหรับลบข้อมูลพนักงาน (DELETE)
app.delete('/employees/:id', (req, res) => {
  const employeeId = req.params.id;

  // คำสั่ง SQL สำหรับการลบข้อมูลพนักงาน
  const query = `DELETE FROM employees WHERE id = ?`;

  // ใช้ MySQL2 เพื่อ execute คำสั่ง SQL
  connection.execute(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Error deleting employee', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee deleted successfully', results });
  });
});

// เริ่มต้นเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
