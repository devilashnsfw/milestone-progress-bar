async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestone = queryParams.get("milestone");

    const progressFill = document.querySelector(".progress-fill");
    const progressInfo = document.querySelector(".progress-info");
    const milestoneTitle = document.querySelector("#milestone-title");

    if (!user || !repo || !milestone) {
        progressInfo.textContent = "Invalid URL parameters.";
        progressInfo.classList.add("error");
        return;
    }

    try {
        // Fetch milestones
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        console.log("Fetching milestones from:", milestonesUrl);

        const response = await fetch(milestonesUrl);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const milestones = await response.json();
        console.log("Milestones response:", milestones);

        const selectedMilestone = milestones.find(m => m.title === milestone);

        if (!selectedMilestone) {
            progressInfo.textContent = "Milestone not found.";
            progressInfo.classList.add("error");
            return;
        }

        // Set milestone title dynamically
        milestoneTitle.textContent = selectedMilestone.title;

        const { open_issues, closed_issues } = selectedMilestone;
        const totalIssues = open_issues + closed_issues;

        const progressPercentage = totalIssues
            ? Math.round((closed_issues / totalIssues) * 100)
            : 100;  // Default to 100% if no issues exist

        // Apply solid color based on progress percentage
        if (progressPercentage === 100) {
            progressFill.style.backgroundColor = "#4caf50";  // Green for 100%
        } else if (progressPercentage >= 75) {
            progressFill.style.backgroundColor = "#2196f3";  // Blue for 75%+
        } else if (progressPercentage >= 50) {
            progressFill.style.backgroundColor = "#ff9800";  // Orange for 50%+
        } else if (progressPercentage >= 25) {
            progressFill.style.backgroundColor = "#ff5722";  // Red-Orange for 25%+
        } else {
            progressFill.style.backgroundColor = "#9e9e9e";  // Grey for low progress
        }

        progressFill.style.width = `${progressPercentage}%`;
        progressInfo.textContent = `${progressPercentage}% Complete (${closed_issues}/${totalIssues} Issues)`;
    } catch (error) {
        console.error("Error fetching milestone data:", error);
        progressInfo.textContent = "Error loading progress.";
        progressInfo.classList.add("error");
    }
}

document.addEventListener("DOMContentLoaded", fetchMilestoneProgress);
