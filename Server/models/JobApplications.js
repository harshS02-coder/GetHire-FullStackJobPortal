import mongoose from 'mongoose'

const jobApplicationSchema = new mongoose.Schema({
   userId : {type: mongoose.Schema.Types.ObjectId, ref:'User', required: true}, 
   companyId : {type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true},
   jobId : {type: mongoose.Schema.Types.ObjectId, ref:'Job', required: true},
   status : {type: String, default : "Pending"},
   date :{type: Number, required:true }
})

const Application = mongoose.model('Application', jobApplicationSchema)
export default Application