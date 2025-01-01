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

        const milestoneNumber = milestone.number;
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === "closed").length;

        const tagCounts = {};
        const tagClosedCounts = {};
        issues.forEach(issue => {
            issue.labels.forEach(label => {
                const tag = label.name;
                if (!tagCounts[tag]) {
                    tagCounts[tag] = 0;
                    tagClosedCounts[tag] = 0;
                }
                tagCounts[tag]++;
                if (issue.state === "closed") {
                    tagClosedCounts[tag]++;
                }
            });
        });

        const filteredTags = Object.keys(tagCounts).filter(tag => tagCounts[tag] > 0);
        const tagColors = generateTagColors(filteredTags.length);

        drawProgressBar(milestone.title, closedIssues, totalIssues, tagCounts, tagClosedCounts, filteredTags, tagColors);

    } catch (error) {
        console.error("Error fetching milestone data:", error);
    }
}

function drawProgressBar(title, closedCount, totalCount, tagCounts, tagClosedCounts, filteredTags, tagColors) {
    const canvas = document.getElementById("progressCanvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const barWidth = width - 40;
    const barHeight = 16;
    const startX = 20;
    let startY = 40;

    ctx.clearRect(0, 0, width, canvas.height);

    // Title and overall progress
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(title, startX, startY);

    // Draw progress info
    const percentage = Math.round((closedCount / totalCount) * 100);
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${percentage}% Complete (${closedCount}/${totalCount} Issues)`, width - 20, startY);

    // Draw overall progress bar
    startY += 20;
    let xOffset = startX;
    // filteredTags.forEach((tag, index) => {
    //     const widthPercentage = (tagCounts[tag] / totalCount) * barWidth;
    //     ctx.fillStyle = tagColors[index];
    //     ctx.fillRect(xOffset, startY, widthPercentage, barHeight);
    //     xOffset += widthPercentage;
    // });
    filteredTags.forEach((tag, index) => {
        const tagCount = tagCounts[tag];
        const closedTagCount = tagClosedCounts[tag];

        const segmentWidth = (tagCount / totalCount) * barWidth;
        const closedSegmentWidth = (closedTagCount / tagCount) * segmentWidth;

        ctx.fillStyle = tagColors[index];
        ctx.fillRect(xOffset, startY, closedSegmentWidth, barHeight);

        xOffset += segmentWidth;
    });

    // Incomplete progress
    // Draw open issues as grey
    // const openWidth = (openCount / totalCount) * barWidth;
    // ctx.fillStyle = "#d6d6d6";
    // ctx.fillRect(xOffset, startY, openWidth, barHeight);
    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(xOffset, startY, barWidth - xOffset + startX, barHeight);

    // Separator
    startY += 30;
    ctx.fillStyle = "#ccc";
    ctx.fillRect(startX, startY, barWidth, 2);

    // Draw individual tag progress
    startY += 20;
    filteredTags.forEach((tag, index) => {
        startY += 2;

        ctx.font = "14px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.fillText(tag, startX, startY);

        startY += 10;
        ctx.fillStyle = "#d6d6d6";
        ctx.fillRect(startX, startY, barWidth, barHeight);

        const closedTagWidth = (tagClosedCounts[tag] / tagCounts[tag]) * barWidth;
        ctx.fillStyle = tagColors[index];
        ctx.fillRect(startX, startY, closedTagWidth, barHeight);

        startY += 30;
    });
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

fetchMilestoneProgress();
