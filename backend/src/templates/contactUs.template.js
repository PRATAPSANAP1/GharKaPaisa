module.exports = (name, subject, message) => `
<!DOCTYPE html>
<html>
<body>
<h2>New Contact Us Inquiry</h2>
<p><strong>From:</strong> ${name}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message}</p>
</body>
</html>`;