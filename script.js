async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestoneTitle = queryParams.get("milestone");

    const progressFill = document.querySelector(".progress-fill");
    const progressInfo = document.querySelector(".progress-info");
    const milestoneElement = document.querySelector("#milestone-title");

    if (!user || !repo || !milestoneTitle) {
        progressInfo.textContent = "Invalid URL parameters.";
        progressInfo.classList.add("error");
        return;
    }

    try {
        // Fetch milestones to get the milestone number
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        const milestonesResponse = await fetch(milestonesUrl);

        if (!milestonesResponse.ok) {
            throw new Error(`HTTP Error: ${milestonesResponse.status}`);
        }

        const milestones = await milestonesResponse.json();
        const selectedMilestone = milestones.find(m => m.title === milestoneTitle);

        if (!selectedMilestone) {
            progressInfo.textContent = "Milestone not found.";
            progressInfo.classList.add("error");
            return;
        }

        // Set the milestone title dynamically
        milestoneElement.textContent = selectedMilestone.title;

        const milestoneNumber = selectedMilestone.number;

        // Fetch issues for the selected milestone
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();

        // Group issues by tag
        const tagCounts = {};
        issues.forEach(issue => {
            const labels = issue.labels;
            labels.forEach(label => {
                const tag = label.name;
                if (!tagCounts[tag]) {
                    tagCounts[tag] = 0;
                }
                tagCounts[tag]++;
            });
        });

        if (Object.keys(tagCounts).length === 0) {
            progressInfo.textContent = "No tagged issues found.";
            progressInfo.classList.add("error");
            return;
        }

        // Calculate total issues
        const totalIssues = issues.length;

        // Generate tag colors dynamically
        const tagColors = generateTagColors(Object.keys(tagCounts).length);

        let currentWidth = 0;
        Object.keys(tagCounts).forEach((tag, index) => {
            const tagCount = tagCounts[tag];
            const tagPercentage = (tagCount / totalIssues) * 100;
            const tagWidth = `${tagPercentage}%`;

            const tagColor = tagColors[index];

            const tagElement = document.createElement("div");
            tagElement.style.backgroundColor = tagColor;
            tagElement.style.width = tagWidth;
            tagElement.style.height = "100%";
            tagElement.title = `${tag}: ${tagCount} issues`;

            progressFill.appendChild(tagElement);

            currentWidth += tagPercentage;
        });

        progressInfo.textContent = `${Math.round(currentWidth)}% Complete (${totalIssues} Issues)`;
    } catch (error) {
        console.error("Error fetching milestone data:", error);
        progressInfo.textContent = "Error loading progress.";
        progressInfo.classList.add("error");
    }
}

function generateTagColors(numTags) {
    // Generate a list of colors dynamically for each tag
    const baseColors = [
        "#4caf50", "#2196f3", "#ff9800", "#ff5722", "#9e9e9e", 
        "#673ab7", "#ffeb3b", "#00bcd4", "#9c27b0", "#607d8b"
    ];

    const colors = [];
    for (let i = 0; i < numTags; i++) {
        colors.push(baseColors[i % baseColors.length]); // Repeat colors if more tags than base colors
    }
    return colors;
}

document.addEventListener("DOMContentLoaded", fetchMilestoneProgress);
