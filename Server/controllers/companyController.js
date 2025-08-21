import Company from "../models/Company.js";
import Jobs from "../models/Jobs.js";
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import { promises } from "fs";
import Application from '../models/JobApplications.js'
import User from '../models/Users.js'

export const registerCompany = async (req, res) => {
    const { name, email, password } = req.body;
    const imageFile = req.file;

    console.log("details", req.body);
    console.log(req.file);

    if (!name || !email || !password || !imageFile) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try {
        const companyExist = await Company.findOne({ email });
        if (companyExist) {
            return res.json({ success: false, message: "Company already registered" });
        }

        const round = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, round);

        const imageUpload = await cloudinary.uploader.upload(imageFile.path);

        const company = await Company.create({
            name,
            email,
            password: hashedPass,
            image: imageUpload.secure_url
        });

        res.json({
            success: true,
            company: {
                _id: company.id,
                name: company.name,
                email: company.email,
                image: company.image
            },
            token: generateToken({id: company._id})
        });

    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: "error in registering company",
            error: error.message
        });
    }
};



export const companyLogin = async(req,res) =>{

    const {email, password} = req.body;
    
    try {
        const company = await Company.findOne({email}); 

        console.log("comapny", company);
        console.log(email);

        if(await bcrypt.compare(password, company.password)){

            res.json({
                success : true,
                company: {
                    _id: company.id,
                    name: company.name,
                    email: company.email,
                    image: company.image
                },
                token: generateToken({id: company._id})
            })
        }else{
            res.json({
                success:false,
                message:'Invalid credentials'
            })
        }
    } catch (error) {
        res.json({
            success:true,
            message:"error in logging company",
            error: error.message
        })
    }
}


export const getCompanyData = async(req, res) =>{

    const company = req.company;

    try {
    
        res.json({
            success: true,
            company
        })
    } catch (error) {
        res.json({
            success: false,
            message:error.message
        })
    }

}

export const postjob = async(req, res) =>{

    const {jobTitle, description, location, salary, category, level} = req.body;
    
    const companyId = req.company._id;

    console.log(companyId, {jobTitle, description, location, salary, category, level});

    // if(!jobTitle || !location || !category || !description || !salary){
    //     res.json({success:false, message:"Missing required details"})
    // }

    try {
        const newJob = new Jobs({
            jobTitle,
            description,
            location,
            salary,
            category,
            companyId,
            level,
            visibility:true,
            date : Date.now()
        })
        await newJob.save();

        res.json({success:true, message:"New jobs added", newJob})
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const getCompanyJobApplicants = async (req, res) => {
    try {
        const companyId = req.company._id;

        const applicants = await Application.find({ companyId })
        .populate("jobId", "jobTitle location category level salary")
        .populate('userId', 'name image resume')
        .exec()
      
      return res.json({ success: true, applicants});
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
};


export const getCompanyPostedJobs = async(req,res) =>{

    try {
        const companyId = req.company._id

        const jobs = await Jobs.find({companyId});

        //adding of number of apllicants will be done after i will create apply jobs api

        const jobsData = await Promise.all(jobs.map(async (job) =>{
            const applicants = await Application.find({jobId : job._id});
            return {...job.toObject(), applicants:applicants.length}
        }))

        if(!jobsData) {
            res.json({
                success: false,
                message: "Company didn't post any jobs yet"
            })
        }
        res.json({
            success:true,
            jobsData
        })

    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }

}

export const ChangeJobApplicationStatus = async(req, res) =>{

        
    try {
        const {id , status } = req.body

        await Application.findOneAndUpdate({_id:id},{status})

        res.json({
            success:true,
            message:"Status Changed Successfully"
        })
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const changeVisibility = async(req,res) => {

    try{
        const {jobId} = req.body;

        const companyId = req.company._id

        const job = await Jobs.findById(jobId)

        if(companyId.toString() === job.companyId.toString()){
            job.visibility = !job.visibility
        }

        await job.save();
        console.log(job.visibility)
        res.json({
            success:true,
            message:"visibility changed successfully"
        })
    }catch(error){
        res.json({
            success:false,
            message:error.message
        })
    }
}


