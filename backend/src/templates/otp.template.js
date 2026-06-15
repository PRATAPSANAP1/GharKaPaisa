module.exports = (name, otp) => `
<!DOCTYPE html>
<html>
<body>
<h2>OTP Verification</h2>
<p>Hello ${name},</p>
<p>Your OTP for GharKaPaisa verification is:</p>
<h1>${otp}</h1>
<p>This OTP is valid for 10 minutes.</p>
<p>Please do not share this OTP with anyone.</p>
</body>
</html>`;