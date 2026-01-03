const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'analysis_demo_v2.html');
const content = fs.readFileSync(filePath, 'utf8');

// Find news items
// Looking for patterns like "article/7", "article/1", etc.
const newsRegex = /<a href="[^"]*article\/(\d+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;

// Since regex on full HTML structure can be brittle, let's look for specific article IDs and grab surrounding context
const articleIds = ['7', '1', '5', '2'];

articleIds.forEach(id => {
  const index = content.indexOf(`article/${id}`);
  if (index !== -1) {
    console.log(`\n--- Article ${id} ---`);
    // Look backwards for image
    const startSearch = Math.max(0, index - 1000);
    const endSearch = Math.min(content.length, index + 1000);
    const snippet = content.substring(startSearch, endSearch);
    
    // console.log(snippet); // Too much noise
    
    // Search backwards from the match index for the closest h3 and img
    const relativeIndex = index - startSearch;
    const beforeMatch = snippet.substring(0, relativeIndex);
    
    // Find closest h3
    const lastH3Open = beforeMatch.lastIndexOf('<h3');
    if (lastH3Open !== -1) {
       const h3Content = beforeMatch.substring(lastH3Open).match(/<h3[^>]*>(.*?)<\/h3>/);
       if (h3Content) console.log(`Title: ${h3Content[1]}`);
    }

    // Find closest img
    const lastImgTag = beforeMatch.lastIndexOf('<img');
    if (lastImgTag !== -1) {
       const imgContent = beforeMatch.substring(lastImgTag).match(/src="([^"]*)"/);
       if (imgContent) console.log(`Image: ${imgContent[1]}`);
    }
    
    // Find date (span)
    const lastSpan = beforeMatch.lastIndexOf('<span');
     if (lastSpan !== -1) {
         // Search a bit more context for date
         const spanSection = beforeMatch.substring(Math.max(0, lastSpan - 500));
         const dateMatch = spanSection.match(/<span[^>]*text-gray-500[^>]*>(.*?)<\/span>/);
         if (dateMatch) console.log(`Date: ${dateMatch[1]}`);
    }
  }
});
