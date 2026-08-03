const createButton = document.querySelector('.create-button');
const overlay = document.querySelector('.overlay');

const backButton = document.querySelector('.back-button');

createButton.addEventListener('click', e => {
    overlay.classList.remove('hidden');
});


backButton.addEventListener('click', e => {
    overlay.classList.add('hidden');
})


