const nodemailer = require('nodemailer');
 
const mailServer =async(verifierEmail,verifierId)=>{
console.log("verifierEmail",verifierEmail, "verifierId",verifierId)
let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'manoj.raja410@gmail.com',
        pass: 'grmjlpozzqhduvmo'
    }
});
 
let mailDetails = {
    from: 'no-reply<manoj.raja410@gmail.com>',
    to: verifierEmail,
    subject: 'Verification Code',
    text: 'Please Click the link to verify the certificate using this Verifier Code : '+ verifierId
};
 
await mailTransporter.sendMail(mailDetails, function(err, data) {
    if(err) {
        console.log('Error Occurs', err);
        return false
    } else {
        console.log('Email sent successfully');
        return true;
    }
})
}
exports.mailServer=mailServer

