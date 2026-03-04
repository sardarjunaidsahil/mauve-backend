require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

const slug = (name, i) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + i;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const price = (min, max) => Math.floor(Math.random() * (max - min + 1) + min) * 100;

const menImages = [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
    "https://images.unsplash.com/photo-1602810319428-019690571b5b?w=600&q=80",
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
    "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&q=80",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80",
];
const womenImages = [
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
];
const footwearImages = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
];
const accessoryImages = [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&q=80",
    "https://images.unsplash.com/photo-1625591342274-013866180ee2?w=600&q=80",
];

const products = [];
let idx = 1;

const menData = [
    { sub: "graphic-tees", sizes: ["XS", "S", "M", "L", "XL", "XXL"], colors: ["Black", "White", "Grey", "Navy", "Red", "Olive"], names: ["Oversized Graphic Tee", "Urban Print Tee", "Street Art Tee", "Band Graphic Tee", "Abstract Print Tee", "City Skyline Tee", "Retro Graphic Tee", "Bold Statement Tee", "Comic Print Tee", "Vintage Wash Tee", "Grunge Graphic Tee", "Tie-Dye Tee", "Photo Print Tee", "Neon Print Tee", "Minimal Graphic Tee", "Acid Wash Graphic Tee", "Distressed Print Tee", "Oversized Logo Tee", "Sketch Print Tee", "Streetwear Tee"] },
    { sub: "polo-shirts", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["White", "Navy", "Black", "Olive", "Beige", "Red"], names: ["Striped Knit Polo", "Ribbed Collar Polo", "Classic Pique Polo", "Textured Polo", "Slim Fit Polo", "Casual Polo", "Premium Cotton Polo", "Logo Polo", "Contrast Collar Polo", "Solid Polo", "Embroidered Polo", "Oxford Polo", "Sport Polo", "Essential Polo", "Heritage Polo", "Moisture Wick Polo", "Performance Polo", "Vintage Polo", "Luxury Polo", "Resort Polo"] },
    { sub: "shirts", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["White", "Blue", "Navy", "Olive", "Beige", "Black"], names: ["Linen Summer Shirt", "Floral Print Shirt", "Plaid Check Shirt", "Oxford Button Down", "Casual Camp Shirt", "Poplin Shirt", "Resort Shirt", "Denim Shirt", "Flannel Shirt", "Chambray Shirt", "Mandarin Collar Shirt", "Cuban Collar Shirt", "Dobby Shirt", "Voile Shirt", "Twill Shirt", "Oversized Shirt", "Stripe Shirt", "Abstract Print Shirt", "Paisley Shirt", "Boxy Fit Shirt"] },
    { sub: "basic-tees", sizes: ["XS", "S", "M", "L", "XL", "XXL"], colors: ["Black", "White", "Grey", "Beige", "Navy", "Charcoal"], names: ["Essential White Tee", "Premium Black Tee", "Classic Grey Tee", "Heavyweight Tee", "Slim Fit Tee", "Relaxed Tee", "Longline Tee", "V-Neck Tee", "Crew Neck Tee", "Supima Cotton Tee", "Modal Tee", "Waffle Knit Tee", "Thermal Tee", "Pocket Tee", "Vintage Tee", "Acid Wash Tee", "Pigment Dyed Tee", "Enzyme Wash Tee", "Garment Dyed Tee", "Brushed Cotton Tee"] },
    { sub: "chino-pants", sizes: ["28", "30", "32", "34", "36", "38"], colors: ["Beige", "Navy", "Olive", "Black", "Grey", "Brown"], names: ["Slim Chino", "Tapered Chino", "Stretch Chino", "Classic Chino", "Cargo Chino", "Drawstring Chino", "Pleated Chino", "Cropped Chino", "Wide Leg Chino", "Linen Chino", "Cotton Chino", "Smart Chino", "Relaxed Chino", "Rolled Hem Chino", "Essential Chino"] },
    { sub: "denim-jeans", sizes: ["28", "30", "32", "34", "36"], colors: ["Indigo", "Black", "Grey", "Light Blue", "Dark Blue"], names: ["Slim Fit Jeans", "Straight Cut Jeans", "Skinny Jeans", "Relaxed Jeans", "Tapered Jeans", "Distressed Jeans", "Dark Wash Jeans", "Light Wash Jeans", "Black Denim", "Acid Wash Jeans", "Carpenter Jeans", "Baggy Jeans", "Cropped Jeans", "Raw Hem Jeans", "Selvedge Jeans"] },
    { sub: "co-ord-sets", sizes: ["S", "M", "L", "XL"], colors: ["Black", "White", "Navy", "Olive", "Beige"], names: ["Textured Co-Ord", "Printed Co-Ord", "Linen Co-Ord", "Stripe Co-Ord", "Solid Co-Ord", "Dobby Co-Ord", "Check Co-Ord", "Resort Co-Ord", "Classic Co-Ord", "Premium Co-Ord"] },
    { sub: "jogger-pants", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Black", "Grey", "Navy", "Olive", "Brown"], names: ["Fleece Jogger", "Cotton Jogger", "Slim Jogger", "Tapered Jogger", "Cargo Jogger", "Essential Jogger", "Tech Jogger", "Cuffed Jogger", "Drawstring Jogger", "Athletic Jogger"] },
    { sub: "shorts", sizes: ["S", "M", "L", "XL"], colors: ["Beige", "Navy", "Black", "Olive", "Grey"], names: ["Chino Shorts", "Denim Shorts", "Cargo Shorts", "Board Shorts", "Athletic Shorts", "Printed Shorts", "Linen Shorts", "Stretch Shorts", "Classic Shorts", "Bermuda Shorts"] },
];

menData.forEach(({ sub, sizes, colors, names }) => {
    names.forEach((name) => {
        const p = price(2500, 9000);
        const disc = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
        const orig = Math.round(p / (1 - disc / 100) / 100) * 100;
        products.push({ name, slug: slug(name, idx++), description: `Premium ${name} crafted for everyday comfort and style.`, price: p, original_price: orig, discount: disc, category: "men", sub_category: sub, article_no: `MV-M-${String(idx).padStart(4, "0")}`, model_info: "Model is 6'1\" wearing size M", images: [rand(menImages), rand(menImages)], sizes, colors: colors.slice(0, 3), stock: Math.floor(Math.random() * 50) + 10, is_featured: Math.random() > 0.85 });
    });
});

const womenData = [
    { sub: "tops", sizes: ["XS", "S", "M", "L", "XL"], colors: ["White", "Black", "Pink", "Lavender", "Beige", "Mint"], names: ["Flowy Chiffon Top", "Crop Knit Top", "Off Shoulder Top", "Puff Sleeve Top", "Printed Blouse", "Ruffle Top", "Tie Front Top", "Striped Crop Top", "Lace Trim Top", "Sleeveless Top", "Wrap Top", "Button Down Top", "V-Neck Blouse", "Boxy Crop Top", "Ribbed Knit Top", "Smocked Top", "Corset Top", "Halter Top", "Cami Top", "Sheer Blouse"] },
    { sub: "dresses", sizes: ["XS", "S", "M", "L", "XL"], colors: ["Floral", "Black", "White", "Pink", "Navy", "Sage"], names: ["Floral Midi Dress", "Wrap Midi Dress", "Shirt Dress", "Slip Dress", "Maxi Dress", "Mini Dress", "Tiered Dress", "Smocked Dress", "Bodycon Dress", "A-Line Dress", "Linen Dress", "Printed Maxi", "Ruffle Dress", "Cami Dress", "Blazer Dress", "Sundress", "Kaftan Dress", "Shirt Waist Dress", "Babydoll Dress", "Boho Maxi Dress"] },
    { sub: "co-ord-sets", sizes: ["XS", "S", "M", "L"], colors: ["Pink", "White", "Black", "Beige", "Sage"], names: ["Printed Co-Ord", "Linen Co-Ord", "Crop Top Co-Ord", "Blazer Co-Ord", "Floral Co-Ord", "Stripe Co-Ord", "Embroidered Co-Ord", "Resort Co-Ord", "Solid Co-Ord", "Premium Co-Ord"] },
    { sub: "bottoms", sizes: ["XS", "S", "M", "L", "XL"], colors: ["Black", "White", "Beige", "Navy", "Brown"], names: ["Wide Leg Trousers", "Linen Palazzo", "Tailored Pants", "Cargo Pants", "Paperbag Trousers", "Pleated Skirt", "Midi Skirt", "Mini Skirt", "Denim Skirt", "Floral Skirt", "Satin Skirt", "Jogger Pants", "Bike Shorts", "Culottes", "Straight Pants"] },
    { sub: "outerwear", sizes: ["XS", "S", "M", "L", "XL"], colors: ["Black", "Camel", "Beige", "Navy", "Grey"], names: ["Longline Blazer", "Denim Jacket", "Trench Coat", "Oversized Blazer", "Quilted Jacket", "Utility Jacket", "Bomber Jacket", "Shacket", "Knit Cardigan", "Linen Blazer"] },
];

womenData.forEach(({ sub, sizes, colors, names }) => {
    names.forEach((name) => {
        const p = price(2000, 10000);
        const disc = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
        const orig = Math.round(p / (1 - disc / 100) / 100) * 100;
        products.push({ name, slug: slug(name, idx++), description: `Elegant ${name} designed for the modern woman.`, price: p, original_price: orig, discount: disc, category: "women", sub_category: sub, article_no: `MV-W-${String(idx).padStart(4, "0")}`, model_info: "Model is 5'7\" wearing size S", images: [rand(womenImages), rand(womenImages)], sizes, colors: colors.slice(0, 3), stock: Math.floor(Math.random() * 50) + 10, is_featured: Math.random() > 0.85 });
    });
});

const footwearData = [
    { sub: "sneakers", sizes: ["39", "40", "41", "42", "43", "44", "45"], colors: ["White", "Black", "Grey", "Navy", "Tan"], names: ["Classic White Sneaker", "Chunky Sneaker", "Minimal Leather Sneaker", "Canvas Low Top", "High Top Sneaker", "Retro Runner", "Mesh Sneaker", "Platform Sneaker", "Slip On Sneaker", "Suede Sneaker", "Knit Sneaker", "Court Sneaker", "Dad Sneaker", "Monochrome Sneaker", "Tech Sneaker"] },
    { sub: "slides", sizes: ["39", "40", "41", "42", "43", "44"], colors: ["Black", "White", "Brown", "Navy"], names: ["Comfort Slide", "Logo Slide", "Leather Slide", "EVA Foam Slide", "Double Strap Slide", "Sports Slide", "Embossed Slide", "Pool Slide", "Cushioned Slide", "Classic Slide"] },
    { sub: "sandals", sizes: ["36", "37", "38", "39", "40", "41"], colors: ["Brown", "Tan", "Black", "White"], names: ["Strappy Sandal", "Gladiator Sandal", "Flat Sandal", "Wedge Sandal", "Sport Sandal", "Leather Sandal", "Espadrille Sandal", "T-Strap Sandal", "Ankle Strap Sandal", "Braided Sandal"] },
    { sub: "boots", sizes: ["39", "40", "41", "42", "43", "44", "45"], colors: ["Black", "Brown", "Tan", "Grey"], names: ["Chelsea Boot", "Ankle Boot", "Combat Boot", "Desert Boot", "Chukka Boot", "Side Zip Boot", "Lace Up Boot", "Suede Boot", "Leather Boot", "Work Boot"] },
];

footwearData.forEach(({ sub, sizes, colors, names }) => {
    names.forEach((name) => {
        const p = price(3500, 15000);
        const disc = [10, 15, 20][Math.floor(Math.random() * 3)];
        const orig = Math.round(p / (1 - disc / 100) / 100) * 100;
        products.push({ name, slug: slug(name, idx++), description: `Step up your style with ${name}.`, price: p, original_price: orig, discount: disc, category: "footwear", sub_category: sub, article_no: `MV-F-${String(idx).padStart(4, "0")}`, model_info: "Model wearing size 42", images: [rand(footwearImages), rand(footwearImages)], sizes, colors: colors.slice(0, 2), stock: Math.floor(Math.random() * 40) + 5, is_featured: Math.random() > 0.85 });
    });
});

const accessoryData = [
    { sub: "caps", sizes: ["Free Size"], colors: ["Black", "White", "Navy", "Beige", "Olive"], names: ["Classic Dad Cap", "Snapback Cap", "Bucket Hat", "Structured Cap", "5 Panel Cap", "Flat Brim Cap", "Vintage Cap", "Embroidered Cap", "Sport Cap", "Mesh Cap", "Wool Cap", "Baseball Cap", "Trucker Cap", "Canvas Cap", "Logo Cap"] },
    { sub: "bags", sizes: ["Free Size"], colors: ["Black", "Brown", "Tan", "Navy", "Beige"], names: ["Tote Bag", "Crossbody Bag", "Backpack", "Mini Bag", "Shoulder Bag", "Laptop Bag", "Clutch Bag", "Drawstring Bag", "Belt Bag", "Messenger Bag"] },
    { sub: "belts", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Brown", "Tan", "Navy"], names: ["Leather Belt", "Canvas Belt", "Braided Belt", "Reversible Belt", "Woven Belt", "Pin Buckle Belt", "Slide Buckle Belt", "Double Ring Belt", "Statement Belt", "Classic Belt"] },
    { sub: "socks", sizes: ["Free Size"], colors: ["Black", "White", "Grey", "Navy", "Mixed"], names: ["Ankle Socks Pack", "Crew Socks Pack", "No Show Socks", "Athletic Socks", "Printed Socks", "Striped Socks", "Compression Socks", "Cushioned Socks", "Bamboo Socks", "Cotton Socks"] },
    { sub: "wallets", sizes: ["Free Size"], colors: ["Black", "Brown", "Tan", "Navy"], names: ["Slim Card Wallet", "Bifold Wallet", "Zip Wallet", "Long Wallet", "Money Clip Wallet", "Phone Wallet", "Leather Wallet", "Canvas Wallet", "RFID Wallet", "Minimalist Wallet"] },
];

accessoryData.forEach(({ sub, sizes, colors, names }) => {
    names.forEach((name) => {
        const p = price(500, 5000);
        const disc = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
        const orig = Math.round(p / (1 - disc / 100) / 100) * 100;
        products.push({ name, slug: slug(name, idx++), description: `Complete your look with ${name}.`, price: p, original_price: orig, discount: disc, category: "accessories", sub_category: sub, article_no: `MV-A-${String(idx).padStart(4, "0")}`, model_info: null, images: [rand(accessoryImages), rand(accessoryImages)], sizes, colors: colors.slice(0, 2), stock: Math.floor(Math.random() * 100) + 20, is_featured: Math.random() > 0.9 });
    });
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log(`🌱 Seeding ${products.length} products...`);
        await client.query("BEGIN");
        await client.query("DELETE FROM products");
        for (const p of products) {
            await client.query(
                `INSERT INTO products (name,slug,description,price,original_price,discount,category,sub_category,article_no,model_info,images,sizes,colors,stock,is_featured)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
                [p.name, p.slug, p.description, p.price, p.original_price, p.discount, p.category, p.sub_category, p.article_no, p.model_info, p.images, p.sizes, p.colors, p.stock, p.is_featured]
            );
        }
        await client.query("COMMIT");
        console.log(`✅ Seeded ${products.length} products!`);
        const cats = ["men", "women", "footwear", "accessories"];
        for (const cat of cats) {
            console.log(`   ${cat}: ${products.filter(p => p.category === cat).length} products`);
        }
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Seed failed:", err.message);
    } finally {
        client.release();
        pool.end();
    }
}

seed();