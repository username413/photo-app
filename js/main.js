import { getAccessToken } from './utilities.js';

const rootURL = 'https://photo-app-secured.herokuapp.com';
let token = "";

const modalElement = document.querySelector('.modal-bg');

window.openModal = (postID) => {
    modalElement.classList.remove('hidden');
    modalElement.setAttribute('aria-hidden', 'false');
    document.querySelector('.close').focus();
    fillModal(postID);
}

window.closeModal = (ev) => {
    modalElement.classList.add('hidden');
    modalElement.setAttribute('aria-hidden', 'false');
    document.querySelector('.open').focus();
};

document.addEventListener('focus', function (event) {
    if (modalElement.getAttribute('aria-hidden') === 'false' && !modalElement.contains(event.target)) {
        event.stopPropagation();
        document.querySelector('.close').focus();
    }
}, true);

const showStories = async () => {
    const endpoint = `${rootURL}/api/stories`;
    const response = await fetch(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    const out = data.map(fillStories).join("");
    document.querySelector(".stories").innerHTML = out;
};

const fillStories = (storiesData) => {
    return `
        <div>
            <img src="${storiesData.user.thumb_url}" alt="stories user profile picture" class="pic" />
            <p>${storiesData.user.username}</p>
        </div>
    `;
};

const showPosts = async () => {
    const endpoint = `${rootURL}/api/posts/`; // change limit
    const res = await fetch(endpoint, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });
    const data = await res.json();
    const out = data.map(fillPosts).join("");
    document.querySelector(".posts").innerHTML = out;
};

const fillPosts = (posts) => {
    const noOfComments = posts.comments.length;
    let commentToShow = "";
    let viewAllComments = "";
    if (noOfComments > 1) {
        const latestComment = posts.comments[noOfComments - 1];
        commentToShow = `<section id="comments">
                            <strong>${latestComment.user.username}</strong> ${latestComment.text}
                        </section>`;
        viewAllComments = `<section id="view-all-comments" onclick="openModal(${posts.id})"> <button class="open">View all ${noOfComments} comments</button></section>`;
    }

    const likeToShow = posts.current_user_like_id ? '<i class="fa-solid fa-heart" style="color: red"></i>' : '<i class="fa-regular fa-heart"></i>';
    const bookmarkToShow = posts.current_user_bookmark_id ? '<i class="fa-solid fa-bookmark"></i>' : '<i class="fa-regular fa-bookmark"></i>';

    const htmlChunk = `
        <section>
            <section id="username-three-icon">
                ${posts.user.username}
                <i class="fa-solid fa-ellipsis"></i>
            </section>
            <section id="posted-content">
                <img src="${posts.image_url}" alt="${posts.alt_text}" />
            </section>
            <section id="post-stats">
                <section id="icons">
                    <span id="icons-left">
                        <button type="button" title="Like this post.">
                            ${likeToShow}
                        </button>
                        <button type="button" title="Comment on this post.">
                            <i class="fa-regular fa-comment"></i>
                        </button>
                        <button type="button" title="Share this post.">
                            <i class="fa-regular fa-paper-plane"></i>
                        </button>
                    </span>
                    <span id="icons-right">
                        <button type="button" title="Bookmark this post.">
                            ${bookmarkToShow}
                        </button>
                    </span>
                </section>
                <section id="like-counter">
                    <strong>${posts.likes.length} likes</strong>
                </section>
                <section id="caption">
                    <strong>${posts.user.username}</strong> ${posts.caption}
                </section>
                ${viewAllComments}
                ${commentToShow}
                <section id="days-ago">
                    ${posts.display_time}
                </section>
            </section>
            <section id="add-comment">
                <div id="comment-input">
                    <form action="emote"><i class="fa-regular fa-face-smile"></i></form>
                    <input type="text" name="add-comment" id="add-comment" placeholder="Add a comment..">
                </div>
                <div id="post-comment-button">
                    <button>Post</button>
                </div>
            </section>
        </section>`;

    return htmlChunk;
};

const fillModal = async (specificPost) => {
    const endpoint = `${rootURL}/api/posts/${specificPost}`;
    const res = await fetch(endpoint, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });
    const data = await res.json();

    document.querySelector(".modal-body>.image").style.backgroundImage = `url("${data.image_url}")`;
    document.querySelector(".the-comments").innerHTML = "";
    document.querySelector(".the-comments").insertAdjacentHTML("beforeend", `
        <h3>
            <img src="${data.user.image_url}"
                alt="post creator profile picture" id="post-creator-pfp" />
            <button id="logged-in-username">${data.user.username}</button>
        </h3>
    `);
    document.querySelector("#post-creator-pfp").src = `${data.user.image_url}`;

    for (const postComment of data.comments) {
        const modalCommentChunk = `
            <div class="comments">
                <strong>${postComment.user.username}</strong> ${postComment.text}
                <p id="days-ago">${postComment.display_time}</p>
            </div>`;
        document.querySelector(".the-comments").insertAdjacentHTML("beforeend", modalCommentChunk);
    };
};

const loggedInUser = async () => {
    const getURL = `${rootURL}/api/profile`;
    const res = await fetch(getURL, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });
    const data = await res.json();
    const updateUserStr = document.querySelectorAll("#logged-in-username");
    for (const userUpdate of updateUserStr) {
        userUpdate.innerHTML = data.username;
    }
    document.querySelector("#logged-in-pfp").src = data.image_url;
};

const suggestedAccs = async () => {
    const getURL = `${rootURL}/api/suggestions/`;
    const res = await fetch(getURL, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });
    const data = await res.json();
    const out = data.map(fillSuggestedAccs).join("");
    document.querySelector(".suggestions").insertAdjacentHTML("beforeend", out);
};

const fillSuggestedAccs = (suggestedUsers) => {
    return `
        <section>
            <img src="${suggestedUsers.image_url}" alt="aside user profile picture" />
            <div>
                <p class="username">${suggestedUsers.username}</p>
                <p id="suggested-for-you">suggested for you</p>
            </div>
            <button class="button">follow</button>
        </section>
    `;
}

const initPage = async () => {
    const readAuth = await fetch("./auth.json");
    if (readAuth.status === 404) {
        token = await getAccessToken(rootURL, 'webdev', 'password');
    } else {
        const userPass = await readAuth.json();
        token = await getAccessToken(rootURL, userPass.user, userPass.pass);
    }
    
    showStories();
    loggedInUser();
    suggestedAccs();
    showPosts();
}

initPage();