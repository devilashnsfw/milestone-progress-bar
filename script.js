async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestoneTitle = queryParams.get("milestone");

    if (!user || !repo || !milestoneTitle) {
        console.error("Invalid URL parameters.");
        return;
    }

    try {
        // Fetch milestone data
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        const milestonesResponse = await fetch(milestonesUrl);

        if (!milestonesResponse.ok) {
            throw new Error(`HTTP Error: ${milestonesResponse.status}`);
        }

        const milestones = await milestonesResponse.json();
        const milestone = milestones.find(m => m.title === milestoneTitle);

        if (!milestone) {
            throw new Error("Milestone not found.");
        }

        // Fetch issues data
        const milestoneNumber = milestone.number;
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === "closed");
        const openIssues = issues.filter(issue => issue.state === "open");

        // Calculate progress
        const percentageComplete = totalIssues > 0 ? Math.round((closedIssues.length / totalIssues) * 100) : 0;

        // Prepare closed issue tag data
        const tagCounts = {};
        closedIssues.forEach(issue => {
            issue.labels.forEach(label => {
                const tag = label.name;
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const totalTags = Object.keys(tagCounts).length;
        const tagColors = generateTagColors(totalTags);

        // Draw progress bar
        drawProgressBar(milestone.title, percentageComplete, closedIssues.length, totalIssues, tagCounts, tagColors, openIssues.length);

    } catch (error) {
        console.error("Error fetching milestone data:", error);
    }
}

function drawProgressBar(title, percentage, closedCount, totalCount, tagCounts, tagColors, openCount) {
    const canvas = document.getElementById("progressCanvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width - 40;
    const barHeight = 16;
    const barX = 20;
    const barY = height / 2 - barHeight / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#eaeaea";
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.font = "16px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(title, barX, barY - 10);

    // Draw progress info
    const infoText = `${percentage}% Complete (${closedCount}/${totalCount} Issues)`;
    ctx.textAlign = "right";
    ctx.fillText(infoText, width - 20, barY - 10);

    // Draw progress bar background
    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress by tags
    let currentX = barX;
    Object.keys(tagCounts).forEach((tag, index) => {
        const widthPercentage = (tagCounts[tag] / totalCount) * barWidth;
        ctx.fillStyle = tagColors[index];
        ctx.fillRect(currentX, barY, widthPercentage, barHeight);
        currentX += widthPercentage;
    });

    // Draw open issues as grey
    const openWidth = (openCount / totalCount) * barWidth;
    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(currentX, barY, openWidth, barHeight);
}

function generateTagColors(count) {
    const baseColors = [
        "#E57373", "#FFB74D", "#81C784", "#64B5F6", "#9575CD",
        "#F06292", "#4DB6AC", "#7986CB", "#FFD54F", "#4DD0E1"
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Convert canvas to image URL
function convertCanvasToImage() {
    const canvas = document.getElementById("progressCanvas");
    return canvas.toDataURL("image/png");
}

// Example of embedding as an image
fetchMilestoneProgress().then(() => {
    const img = document.createElement("img");
    img.src = convertCanvasToImage();
    img.alt = "Milestone Progress";
    document.body.appendChild(img);
});
