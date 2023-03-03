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

window.closeModal = () => {
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
    const endpoint = `${rootURL}/api/posts/`;
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

    const likeToShow = posts.current_user_like_id
        ? `<button type="button" aria-label="Post is liked." onclick="unlikePost(${posts.id}, ${posts.current_user_like_id})" title="Unlike this post."> <i class="fa-solid fa-heart" style="color: red"></i> </button>`
        : `<button type="button" aria-label="Post is not liked." onclick="likePost(${posts.id})" title="Like this post."> <i class="fa-regular fa-heart"></i> </button>`;
    const bookmarkToShow = posts.current_user_bookmark_id
        ? `<button type="button" aria-label="Post is bookmarked." onclick="unbookmarkPost(${posts.current_user_bookmark_id}, ${posts.id})" title="Unbookmark this post."> <i class="fa-solid fa-bookmark"></i> </button>`
        : `<button type="button" aria-label="Post is not bookmarked." onclick="bookmarkPost(${posts.id})" title="Bookmark this post."> <i class="fa-regular fa-bookmark"></i> </button>`;

    const htmlChunk = `
        <section id="post_${posts.id}">
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
                        ${likeToShow}
                        <button type="button" title="Comment on this post.">
                            <i class="fa-regular fa-comment"></i>
                        </button>
                        <button type="button" title="Share this post.">
                            <i class="fa-regular fa-paper-plane"></i>
                        </button>
                    </span>
                    <span id="icons-right">
                        ${bookmarkToShow}
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
                    <input type="text" id="comment-in-${posts.id}" placeholder="Add a comment..">
                </div>
                <div id="post-comment-button">
                    <button onclick="userComment(${posts.id})">Post</button>
                </div>
            </section>
        </section>`;

    return htmlChunk;
};

window.userComment = async (postID) => {
    let userIn = document.querySelector(`#comment-in-${postID}`);
    const endpoint = `${rootURL}/api/comments`;
    const postData = {
        "post_id": postID,
        "text": userIn.value
    };

    await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(postData)
    });
    redraw(postID);
    userIn.focus();
}

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

window.likePost = async (postID) => {
    const endpoint = `${rootURL}/api/posts/likes/`;
    const postData = {
        "post_id": postID
    };

    await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(postData)
    });
    redraw(postID);
}

window.unlikePost = async (postID, likeID) => {
    const endpoint = `${rootURL}/api/posts/likes/${likeID}`;
    await fetch(endpoint, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
    });
    redraw(postID);
}

window.unbookmarkPost = async (bookmarkID, postID) => {
    const endpoint = `${rootURL}/api/bookmarks/${bookmarkID}`;
    await fetch(endpoint, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    });
    redraw(postID);
}

window.bookmarkPost = async (postID) => {
    const endpoint = `${rootURL}/api/bookmarks/`;
    const postData = {
        "post_id": postID
    };

    await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(postData)
    });
    redraw(postID);
}

const redraw = async (postID) => {
    const endpoint = `${rootURL}/api/posts/${postID}`;
    const response = await fetch(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    const htmlString = fillPosts(data);
    targetElementAndReplace(`#post_${postID}`, htmlString);
}

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
        <section id="suggestion_${suggestedUsers.id}">
            <img src="${suggestedUsers.following ? suggestedUsers.following.image_url : suggestedUsers.image_url}" alt="aside user profile picture" />
            <div>
                <p class="username">${suggestedUsers.following ? suggestedUsers.following.username : suggestedUsers.username}</p>
                <p id="suggested-for-you">suggested for you</p>
            </div>
            <button class="button" id="btn_${suggestedUsers.id}" onclick="updateFollowing(${suggestedUsers.id})">${suggestedUsers.following ? 'unfollow' : 'follow'}</button>
        </section>
    `;
}

window.updateFollowing = async (userID) => {
    const buttonValue = document.querySelector(`#btn_${userID}`).innerHTML;
    let oldUserData = "";

    if (buttonValue === "follow") {
        const followEndpoint = `${rootURL}/api/following/`;
        const user = {
            "user_id": userID
        };

        const res = await fetch(followEndpoint, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(user)
        });
        const data = await res.json();

        document.querySelector(`#btn_${userID}`).innerHTML = "unfollow";

        const htmlString = fillSuggestedAccs(data);
        targetElementAndReplace(`#suggestion_${userID}`, htmlString);
    } else {
        const allFollowing = `${rootURL}/api/following`;
        const res = await fetch(allFollowing, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await res.json();
        for (let d of data) {
            if (d.id === userID) {
                oldUserData = d.following;
            }
        }

        const unfollowEndpoint = `${rootURL}/api/following/${userID}`;
        await fetch(unfollowEndpoint, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
        });

        document.querySelector(`#btn_${userID}`).innerHTML = "follow";

        const htmlString = fillSuggestedAccs(oldUserData);
        targetElementAndReplace(`#suggestion_${userID}`, htmlString);
    }
};

const targetElementAndReplace = (selector, newHTML) => {
    const div = document.createElement('div');
    div.innerHTML = newHTML;
    const newEl = div.firstElementChild;
    const oldEl = document.querySelector(selector);
    oldEl.parentElement.replaceChild(newEl, oldEl);
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