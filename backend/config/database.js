const mongoose=require("mongoose");
function database(){
    mongoose.connect("mongodb://localhost:27017/healthhub").then(()=>{
        console.log("Database Connected Successfully")
    }).catch((err)=>{
        console.log(err); 
    })
}
module.exports=database