const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const Book = require('./models/book')
const app = express()

app.use(express.json())
app.use(cors())

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.post('/api/books', async(req, res) => {
  try{
    const { title, author, category, availabilityStatus } = req.body
    if(!title){
      return res.status(400).json({ error: 'Validation Error: Title is required.' })
    }
    const newBook = new Book({
      title,
      author,
      category,
      availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true
    })
    const savedBook = await newBook.save()
    return res.status(201).json({
      message: 'Book added successfully',
      book: savedBook
    })
  }catch(error){
    return res.status(500).json({ error: 'Server error while adding the book', details: error.message })
  }
})

app.get('/api/books', async(req, res) => {
  try{
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const books = await Book.find().skip(skip).limit(limit)
    const totalRecords = await Book.countDocuments()

    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      books
    })
  }catch(error){
    return res.status(500).json({ error: 'Server error while fetching books', details: error.message });
  }
})
app.patch('/api/books/:id', async(req, res) => {
  try{
    const { id } = req.params
    const { availabilityStatus } = req.body
    if(availabilityStatus === undefined){
      return res.status(400).json({ error: 'availabilityStatus is required.' })
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { availabilityStatus },
      { new: true, runValidators: true }
    )
    if(!updatedBook){
      return res.status(404).json({ error: 'Book not found with the provided ID.' });
    }

    return res.status(200).json({
      message: 'Book availability updated successfully',
      book: updatedBook
    })
  }catch(error){
    if(error.kind === 'ObjectId'){
      return res.status(400).json({ error: 'Invalid Book ID format.' })
    }
    return res.status(500).json({ error: 'Server error while updating the book', details: error.message })
  }
})

app.listen(PORT,() => {
  console.log(`Server is running on port ${PORT}`)
})