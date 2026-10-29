const md = window.markdownit({
  html: true,
  breaks: true
}).use(texmath, {
  engine: katex,
  delimiters: 'dollars'
});  
let BASE_URL = "./chemistry-lab/Determination-of-percentage-of-copper-in-brass-using-standard-sodium-thiosulfate-solution/experiment/";
const preview = document.getElementById("preview");
let activeTab = null;


async function loadFromGitHub(url) {

  const preview = document.getElementById("preview");

  try {

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("File not found");
    }

    const text = await res.text();

    // Render markdown
    let rendered = md.render(text);

    preview.innerHTML = rendered;

    
    // Get markdown folder path
    const basePath = url.substring(
      0,
      url.lastIndexOf("/") + 1
    );

    // Fix image paths
    const images = preview.querySelectorAll("img");

    images.forEach(img => {

      const src = img.getAttribute("src");

      // Ignore external URLs
      if (
        src &&
        !src.startsWith("http") &&
        !src.startsWith("/")
      ) {

        img.src = basePath + src;
      }

      img.loading = "lazy";

      img.onerror = () => {
        img.style.display = "none";

        const error = document.createElement("div");

        error.className = "image-error";

        error.innerHTML = `
          ❌ Image failed to load:
          ${src}
        `;

        img.parentNode.insertBefore(error, img);
      };
    });

  } catch (err) {

    console.error(err);

    preview.innerHTML = `
      <div class="error">
        ❌ Error loading content
      </div>
    `;
  }
}

// Initial load
loadFromGitHub(BASE_URL + "aim.md");

function switchTab(event, file) {

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  // CLOSE MOBILE MENU
  document
    .getElementById("tabsMenu")
    .classList.remove("show-tabs");
  console.log("Clicked tab:", event.target, "File:", file);
  event.target.classList.add("active");
  activeTab = file;
  console.log("Switching to tab:", file);

  // QUIZ JSON
  if (activeTab && activeTab.endsWith(".json")) {

    loadQuiz(BASE_URL + activeTab);

  }

  // SIMULATION HTML
  else if (activeTab && activeTab.endsWith(".html")) {

    loadSimulation(BASE_URL + activeTab);

  }

  // MARKDOWN
  else {

    loadFromGitHub(BASE_URL + (activeTab || "aim.md"));

  }
}

// Quiz Loader
 async function loadQuiz(url) {

  const preview = document.getElementById("preview");

  try {

    const res = await fetch(url);

    const data = await res.json();

    let html = `
      <div class="quiz-wrapper">
    `;

    data.questions.forEach((q, index) => {

      html += `

        <div class="quiz-card">

          <div class="quiz-top">

            <h3>
              Question ${index + 1}
            </h3>

            <span class="difficulty ${q.difficulty}">
              Difficulty: ${q.difficulty}
            </span>

          </div>

          <p class="question-text">
            ${q.question}
          </p>

          <div class="options">
      `;

      Object.entries(q.answers).forEach(([key, value]) => {

        const isCorrect = key === q.correctAnswer;

        html += `
          <div class="
            option
            ${isCorrect ? "correct-option" : ""}
          ">

            <span class="option-key">
              ${key.toLowerCase()}: 
            </span>

            <span class="option-text">
              ${value}
            </span>

          </div>
        `;
      });

      html += `
          </div>

          <details class="explanation-box">

            <summary>
              View Explanations
            </summary>

            <div class="explanation-content">
      `;

      Object.entries(q.explanations).forEach(([key, value]) => {

        const isCorrect = key === q.correctAnswer;

        html += `
          <div class="
            explanation-item
            ${isCorrect ? "correct-exp" : ""}
          ">

            <strong>
              ${key.toLowerCase()}:
            </strong>

            ${value}

          </div>
        `;
      });

      html += `
            </div>

          </details>

        </div>
      `;
    });

    html += `</div>`;

    preview.innerHTML = html;

  } catch (err) {

    console.error(err);

    preview.innerHTML = `
      <div class="error">
        ❌ Error loading quiz
      </div>
    `;
  }
}
  

function loadSimulation(url) {

  const preview = document.getElementById("preview");

  preview.innerHTML = `

    <div class="simulation-wrapper">

      <iframe
        src="${url}"
        class="simulation-frame"
        frameborder="0"
        allowfullscreen
      >
      </iframe>
        <div class="simulation-toolbar">

          <a href="${url}" target="_blank">Open Fullscreen</a>

        </div>
    </div>

  `;
}

  // Comments
  function addComment() {
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    const div = document.createElement("div");
    div.className = "comment-box";
    div.innerText = text;

    document.getElementById("commentList").appendChild(div);
    input.value = "";
  }



  function toggleMenu() {

  const tabs = document.getElementById("tabsMenu");

  tabs.classList.toggle("show-tabs");
}


async function loadConfig() {

  try {
    const res = await fetch("./config.json");
    const data = await res.json();
    console.log("Config loaded:", data.labs[0].experiments.length, "experiments found");
    return data;
  } catch (err) {
    console.error("Error loading config:", err);
    return null;
  }
}

// // Load config on page load
// window.addEventListener("DOMContentLoaded", async () => {
//   const config = await loadConfig();
//   // You can use the config data to dynamically generate tabs or content here
// });

async function loadExperiments() {

  const config = await loadConfig();

  const container =
    document.getElementById("experimentList");

  container.innerHTML = "";

  // =========================
  // HEADER
  // =========================

  const header =
    document.createElement("div");

  header.className =
    "experiment-header";

  header.onclick =
    toggleExperiments;

  // TITLE

  const title =
    document.createElement("div");

  title.className =
    "experiment-title";

  title.innerHTML =
    "🧪 Experiments";

  // ARROW

  const arrow =
    document.createElement("div");

  arrow.className =
    "experiment-arrow";

  arrow.id =
    "experimentArrow";

  arrow.innerHTML =
    "▼";

  // APPEND HEADER

  header.appendChild(title);

  header.appendChild(arrow);

  // =========================
  // EXPERIMENT CONTAINER
  // =========================

  const experimentContainer =
    document.createElement("div");

  experimentContainer.className =
    "experiment-container";

  experimentContainer.id =
    "experimentContainer";

  // =========================
  // SCROLL AREA
  // =========================

  const scroll =
    document.createElement("div");

  scroll.className =
    "experiment-scroll";

  // =========================
  // CREATE CARDS
  // =========================

  config.labs[0].experiments.forEach(
    (exp, index) => {

      const card =
        document.createElement("div");

      card.className =
        "experiment-card";

      // FIRST ACTIVE
      if(index === 0){

        card.classList.add("active");

      }

      card.innerText =
        exp.title;

      // CLICK EVENT

      card.addEventListener(
        "click",
        () => {

          // REMOVE ACTIVE

          document
            .querySelectorAll(
              ".experiment-card"
            )
            .forEach(c => {

              c.classList.remove(
                "active"
              );

            });

          // ADD ACTIVE

          card.classList.add(
            "active"
          );

          // LOAD EXPERIMENT

          loadExperimentByPath(
            exp.path
          );

          // UPDATE TITLE

          document
            .querySelector(
              ".preview-title"
            )
            .innerText =
            exp.title || "Determination of Hardness of Water Using EDTA Titration"
";
        }
      );

      scroll.appendChild(card);
    }
  );

  // =========================
  // APPEND EVERYTHING
  // =========================

  experimentContainer.appendChild(
    scroll
  );

  container.appendChild(header);

  container.appendChild(
    experimentContainer
  );
}

// Load experiments on page load
window.addEventListener("DOMContentLoaded", loadExperiments);

// Load on click of experiment links in the sidebar is handled in the loadExperiments function where we add event listeners to each generated link.
async function loadExperimentByPath(path) {
  const config = await loadConfig();
  const experiment = config.labs[0].experiments.find(exp => exp.path === path);
  if (experiment) {
    BASE_URL = experiment.path + "/experiment/";
    // write code for active tab file open on experiment switch as all switch working fine except json
    // loadFromGitHub(BASE_URL + (activeTab || "aim.md"));
    switchTab({ target: document.querySelector(".tab.active") }, activeTab || "aim.md");
    document.querySelector(".preview-title").innerText = experiment.title || "Determination of Hardness of Water Using EDTA Titration"
";
  } else {
    console.error("Experiment not found for path:", path);
  }
}
function openModal(type){

  const overlay =
    document.getElementById(
      "modalOverlay"
    );

  const title =
    document.getElementById(
      "modalTitle"
    );

  const content =
    document.getElementById(
      "modalContent"
    );

  overlay.classList.add("show");

  // ====================
  // GUIDELINES
  // ====================

  if(type === "guidelines"){

    title.innerText =
      "Review Guidelines";

    content.innerHTML = `

      <ul class="guideline-list">

        <li>
          Proposal Link: <a href="https://docs.google.com/document/d/1H5McP9x5_4F-LvzG0ExXeF1WxHVC5QHXwrjoIV2A6kk/edit?usp=sharing" target="_blank">Chemistry LabProposal Document</a>
        </li>

        <li>
          Verify theory accuracy
        </li>

        <li>
          Validate quiz answers
        </li>

        <li>
          Check simulation behavior
        </li>

        <li>
          Ensure markdown formatting
        </li>

      </ul>

    `;
  }

  // ====================
  // DEVELOPERS
  // ====================

  if(type === "developers"){

    title.innerText =
      "Developer Details";

    content.innerHTML = `

      <div class="developer-card">
          <h2>Suhan K Amin</h2>
          <p></p>
            <strong>Role:</strong> JRF at CSD
          </p>
          <p>
            <strong>Email:</strong>
            <a href="mailto:suhankaminofficial@gmail.com">
              suhankaminofficial@gmail.com
            </a>
          </p>
        </div>

    `;
  }
}

function closeModal(){

  document
    .getElementById(
      "modalOverlay"
    )
    .classList.remove("show");
}

window.addEventListener("click", (e) => {

  const overlay =
    document.getElementById(
      "modalOverlay"
    );

  if(e.target === overlay){

    closeModal();
  }
});

function toggleExperiments() {

  const container =
    document.getElementById(
      "experimentContainer"
    );

  const arrow =
    document.getElementById(
      "experimentArrow"
    );

  container.classList.toggle(
    "closed"
  );

  if (
    container.classList.contains(
      "closed"
    )
  ) {

    arrow.innerHTML = "▶";

  } else {

    arrow.innerHTML = "▼";
  }
}
