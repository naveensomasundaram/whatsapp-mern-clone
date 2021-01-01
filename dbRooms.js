import mongoose from 'mongoose';

const roomSchema = mongoose.Schema({    
    name: String,
    createdBy: String,
    timestamp: String,
});

export default mongoose.model('roomdetails', roomSchema);