const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>MAUVE</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; color:#111; }
        .wrapper { max-width:580px; margin:40px auto; background:#fff; }
        .header { background:#000; padding:28px 40px; text-align:center; }
        .header h1 { color:#fff; font-size:28px; font-weight:900; letter-spacing:6px; }
        .body { padding:40px; }
        .footer { background:#f5f5f5; padding:24px 40px; text-align:center; border-top:1px solid #e5e5e5; }
        .footer p { font-size:11px; color:#999; line-height:1.6; }
        h2 { font-size:20px; font-weight:800; margin-bottom:8px; }
        p { font-size:14px; line-height:1.7; color:#444; margin-bottom:12px; }
        .btn { display:inline-block; background:#000; color:#fff !important; font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase; padding:14px 32px; text-decoration:none; margin:16px 0; }
        .divider { border:none; border-top:1px solid #e5e5e5; margin:24px 0; }
        .tag { display:inline-block; font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; padding:4px 10px; }
        .tag-black { background:#000; color:#fff; }
        .tag-red   { background:#dc2626; color:#fff; }
        .tag-green { background:#059669; color:#fff; }
        .tag-blue  { background:#2563eb; color:#fff; }
        .tag-amber { background:#d97706; color:#fff; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header"><h1>MAUVE</h1></div>
        <div class="body">${content}</div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} MAUVE. All rights reserved.<br/>
            This email was sent to you because you have an account with us.<br/>
            If you did not request this, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`;

const statusTag = (status) => {
    const map = {
        pending: "tag-amber", confirmed: "tag-blue", processing: "tag-blue",
        shipped: "tag-blue", delivered: "tag-green", cancelled: "tag-red",
    };
    return `<span class="tag ${map[status] || "tag-black"}">${status}</span>`;
};

// 1. Verification Email
const sendVerificationEmail = async ({ to, name, code }) => {
    const content = `
        <h2>Verify Your Email</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome to MAUVE! Use the code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f5f5f5;border-left:4px solid #000;padding:20px 24px;margin:24px 0;text-align:center;">
            <p style="font-size:36px;font-weight:900;letter-spacing:12px;color:#000;margin:0;">${code}</p>
        </div>
        <p style="font-size:12px;color:#999;">If you didn't create an account with MAUVE, you can safely ignore this email.</p>`;
    await transporter.sendMail({
        from: `"MAUVE" <${process.env.GMAIL_USER}>`,
        to, subject: `${code} — Your MAUVE Verification Code`,
        html: baseTemplate(content),
    });
};

// 2. Password Reset Email
const sendPasswordResetEmail = async ({ to, name, code }) => {
    const content = `
        <h2>Reset Your Password 🔐</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your MAUVE account password. Use the code below — it expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff5f5;border-left:4px solid #dc2626;padding:20px 24px;margin:24px 0;text-align:center;">
            <p style="font-size:36px;font-weight:900;letter-spacing:12px;color:#dc2626;margin:0;">${code}</p>
        </div>
        <p style="font-size:12px;color:#999;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>`;
    await transporter.sendMail({
        from: `"MAUVE" <${process.env.GMAIL_USER}>`,
        to, subject: `${code} — Reset Your MAUVE Password`,
        html: baseTemplate(content),
    });
};

// 3. Welcome Email
const sendWelcomeEmail = async ({ to, name }) => {
    const content = `
        <h2>Welcome to MAUVE 🖤</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account is now active. Explore our latest collections — graphic tees, co-ord sets, sneakers, and more.</p>
        <hr class="divider"/>
        <p style="font-size:13px;color:#666;">As a MAUVE member you get:</p>
        <ul style="font-size:13px;color:#444;line-height:2;padding-left:20px;">
            <li>Order tracking in real-time</li>
            <li>Early access to new drops</li>
            <li>Exclusive member discounts</li>
        </ul>
        <br/>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/collections/new-arrivals" class="btn">Shop New Arrivals</a>`;
    await transporter.sendMail({
        from: `"MAUVE" <${process.env.GMAIL_USER}>`,
        to, subject: "Welcome to MAUVE — Your Account is Ready",
        html: baseTemplate(content),
    });
};

// 4. Order Confirmation Email
const sendOrderConfirmationEmail = async ({ to, name, order }) => {
    const itemsHtml = (order.items || []).map(item => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
                <div style="font-size:13px;font-weight:700;color:#111;">${item.name}</div>
                <div style="font-size:11px;color:#999;margin-top:2px;">${item.size} · ${item.color} · Qty ${item.quantity}</div>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:800;color:#111;">
                PKR ${(item.price * item.quantity).toLocaleString()}
            </td>
        </tr>`).join("");
    const content = `
        <h2>Order Confirmed! 🎉</h2>
        <p>Hi <strong>${name}</strong>, thank you for your order. We've received it and will start processing soon.</p>
        <div style="background:#f9f9f9;padding:16px 20px;margin:20px 0;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <p style="font-size:11px;color:#999;margin:0;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                <p style="font-size:13px;font-weight:800;color:#111;margin:4px 0 0;font-family:monospace;">#${order.id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>${statusTag("confirmed")}</div>
        </div>
        <hr class="divider"/>
        <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;">Items Ordered</p>
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
        <hr class="divider"/>
        <table style="width:100%;font-size:13px;">
            <tr><td style="color:#666;padding:4px 0;">Subtotal</td><td style="text-align:right;font-weight:700;">PKR ${order.subtotal?.toLocaleString()}</td></tr>
            <tr><td style="color:#666;padding:4px 0;">Shipping</td><td style="text-align:right;font-weight:700;">PKR ${order.shipping_fee?.toLocaleString() || "0"}</td></tr>
            ${order.discount_amount > 0 ? `<tr><td style="color:#059669;padding:4px 0;">Discount</td><td style="text-align:right;font-weight:700;color:#059669;">-PKR ${order.discount_amount?.toLocaleString()}</td></tr>` : ""}
            <tr><td style="font-weight:800;font-size:15px;padding:12px 0 4px;border-top:2px solid #000;">Total</td><td style="text-align:right;font-weight:900;font-size:15px;color:#dc2626;padding:12px 0 4px;border-top:2px solid #000;">PKR ${order.total?.toLocaleString()}</td></tr>
        </table>
        <hr class="divider"/>
        <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;">Shipping To</p>
        <p style="font-size:13px;color:#444;line-height:1.8;">${order.full_name}<br/>${order.address}<br/>${order.city}, ${order.province}<br/>${order.phone}</p>
        <br/>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders" class="btn">Track My Order</a>`;
    await transporter.sendMail({
        from: `"MAUVE" <${process.env.GMAIL_USER}>`,
        to, subject: `Order Confirmed — #${order.id?.slice(0, 8).toUpperCase()} | MAUVE`,
        html: baseTemplate(content),
    });
};

// 5. Order Status Update Email
const sendOrderStatusEmail = async ({ to, name, order, newStatus, trackingNo }) => {
    const messages = {
        confirmed: { title: "Order Confirmed ✓", body: "Great news! Your order has been confirmed and will be processed shortly." },
        processing: { title: "Order Being Processed 📦", body: "Your order is currently being packed and prepared for shipment." },
        shipped: { title: "Your Order is On Its Way 🚚", body: "Your order has been shipped! Use the tracking number below to follow your package." },
        delivered: { title: "Order Delivered 🎉", body: "Your order has been delivered. We hope you love your MAUVE pieces!" },
        cancelled: { title: "Order Cancelled", body: "Your order has been cancelled. If you have any questions, please contact our support team." },
    };
    const msg = messages[newStatus] || { title: `Order Update`, body: "Your order status has been updated." };
    const trackingSection = (newStatus === "shipped" && trackingNo) ? `
        <div style="background:#f5f5f5;border-left:4px solid #000;padding:16px 20px;margin:20px 0;">
            <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Tracking Number</p>
            <p style="font-size:16px;font-weight:900;font-family:monospace;color:#000;margin:0;">${trackingNo}</p>
        </div>` : "";
    const content = `
        <h2>${msg.title}</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>${msg.body}</p>
        <div style="background:#f9f9f9;padding:16px 20px;margin:20px 0;">
            <p style="font-size:11px;color:#999;margin:0;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
            <p style="font-size:13px;font-weight:800;color:#111;margin:4px 0 0;font-family:monospace;">#${order.id?.slice(0, 8).toUpperCase()}</p>
        </div>
        ${trackingSection}
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders" class="btn">View My Orders</a>`;
    const subjects = {
        confirmed: `Your MAUVE Order is Confirmed — #${order.id?.slice(0, 8).toUpperCase()}`,
        processing: `Your MAUVE Order is Being Processed — #${order.id?.slice(0, 8).toUpperCase()}`,
        shipped: `Your MAUVE Order Has Shipped 🚚 — #${order.id?.slice(0, 8).toUpperCase()}`,
        delivered: `Your MAUVE Order Has Been Delivered 🎉`,
        cancelled: `MAUVE Order Cancelled — #${order.id?.slice(0, 8).toUpperCase()}`,
    };
    await transporter.sendMail({
        from: `"MAUVE" <${process.env.GMAIL_USER}>`,
        to, subject: subjects[newStatus] || `Order Update — MAUVE`,
        html: baseTemplate(content),
    });
};

const safeSend = async (fn, ...args) => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("[Email] Not configured — skipping");
        return;
    }
    try { await fn(...args); }
    catch (err) { console.error("[Email] Send failed:", err.message); }
};

module.exports = {
    sendVerificationEmail: (data) => safeSend(sendVerificationEmail, data),
    sendPasswordResetEmail: (data) => safeSend(sendPasswordResetEmail, data),
    sendWelcomeEmail: (data) => safeSend(sendWelcomeEmail, data),
    sendOrderConfirmationEmail: (data) => safeSend(sendOrderConfirmationEmail, data),
    sendOrderStatusEmail: (data) => safeSend(sendOrderStatusEmail, data),
};