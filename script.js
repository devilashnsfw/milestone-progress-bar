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

        progressFill.style.width = `${progressPercentage}%`;
        progressInfo.textContent = `${progressPercentage}% Complete (${closed_issues}/${totalIssues} Issues)`;
    } catch (error) {
        console.error("Error fetching milestone data:", error);
        progressInfo.textContent = "Error loading progress.";
        progressInfo.classList.add("error");
    }
}

document.addEventListener("DOMContentLoaded", fetchMilestoneProgress);
