require('dotenv').config();

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        console.log("✅ النماذج المتاحة لمفتاحك هي:");
        data.models.forEach(model => {
            // طباعة النماذج التي تدعم توليد النصوص فقط
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(model.name);
            }
        });
    } catch (error) {
        console.error("❌ حدث خطأ أثناء الفحص:", error);
    }
}

listModels();