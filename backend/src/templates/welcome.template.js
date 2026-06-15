module.exports = (name, partnerId) => `
<!DOCTYPE html>
<html>
<body>
<h2>Welcome to GharKaPaisa</h2>
<p>Dear ${name},</p>
<p>Your registration has been successfully submitted.</p>
<p><strong>Partner ID:</strong> ${partnerId}</p>
<p>Your account is currently under review.</p>
<p>We will notify you once approved.</p>
</body>
</html>`;