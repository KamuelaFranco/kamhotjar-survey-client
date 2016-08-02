const API_ENDPOINT = 'https://kamhotjar.herokuapp.com/survey';

const surveyHtml = document.createElement('div');
const noticeText = document.createElement('span');
surveyHtml.className = 'hotjar-survey';
surveyHtml.style.margin = '0 auto';
surveyHtml.style.zIndex = '9999';
surveyHtml.style.backgroundColor = 'white';
surveyHtml.style.position = 'absolute';
surveyHtml.style.top = '25%';
surveyHtml.style.left = '25%';
surveyHtml.style.border = '2px solid';
surveyHtml.style.borderRadius = '5px';
surveyHtml.style.padding = '10px';
noticeText.className = 'hotjar-survey-notice';
noticeText.style.color = 'red';

function generateUuid(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b};

function getUuid() {
  return window.localStorage['hotjar-survey-uuid'];
}

function setUuid() {
  window.localStorage['hotjar-survey-uuid'] = generateUuid();
}

function getPage() {
  if (window.localStorage['hotjar-survey-page']) {
    return Number(window.localStorage['hotjar-survey-page']);
  }
  return 1;
}

function setPage(page) {
  window.localStorage['hotjar-survey-page'] = Number(page);
}

function generateSurvey(surveyElem, firstQuestion, secondQuestion, currentPage) {
  try {
    surveyElem.removeChild(document.querySelector('.survey-first-input'));
    surveyElem.removeChild(document.querySelector('.survey-second-input'));
  } catch (error) {
    console.warn('First rendering pass');
  }

  const firstInput = document.createElement(firstQuestion.elementType);
  firstInput.className = 'survey-first-input';
  Object.keys(firstQuestion).forEach(key => {
    if (key !== 'elementType') {
      firstInput[key] = firstQuestion[key];
    }
  });

  const secondInput = document.createElement(secondQuestion.elementType);
  secondInput.className = 'survey-second-input';
  Object.keys(secondQuestion).forEach(key => {
    if (key !== 'elementType') {
      secondInput[key] = secondQuestion[key];
    }
  });

  const prevButton = document.querySelector('.survey-prev') || document.createElement('button');
  prevButton.className = 'survey-prev';
  prevButton.innerText = 'Previous Page';
  prevButton.disabled = currentPage === 1;

  const nextButton = document.querySelector('.survey-next') || document.createElement('button');
  nextButton.className = 'survey-next';
  nextButton.innerText = currentPage === 4 ? 'Submit Survey' : 'Next Page';

  surveyElem.appendChild(noticeText);
  surveyElem.appendChild(firstInput);
  surveyElem.appendChild(secondInput);
  surveyElem.appendChild(prevButton);
  surveyElem.appendChild(nextButton);
  document.body.appendChild(surveyElem);
}

function drawSurveyPage(currentPage) {
  const firstQuestions = [{
    elementType: 'input',
    type: 'text',
    name: 'name',
    placeholder: 'Name',
    required: true,
  }, {
    elementType: 'input',
    type: 'number',
    name: 'age',
    placeholder: 'age',
    required: true,
    min: 10,
    max: 99,
  }, {
    elementType: 'input',
    type: 'text',
    name: 'address',
    placeholder: 'Address',
  }, {
    elementType: 'input',
    type: 'text',
    name: 'favourite_book',
    placeholder: 'Favourite book',
  }];
  const secondQuestions = [{
    elementType: 'input',
    type: 'email',
    name: 'email',
    placeholder: 'Email',
    required: true,
  }, {
    elementType: 'textarea',
    required: true,
    name: 'about_me',
    placeholder: 'Tell us about yourself',
  }, {
    elementType: 'div',
    innerHTML: '<input type="radio" name="gender" value="1">Male<input type="radio" name="gender" value="2">Female',
  }, {
    elementType: 'div',
    innerHTML: '<input type="checkbox" name="red" value="red">Red<input type="checkbox" name="blue" value="blue">Blue<input type="checkbox" name="yellow" value="yellow">Yellow',
  }];

  switch (currentPage) {
    case 0:
      break;
    case 1:
      generateSurvey(surveyHtml, firstQuestions[0], secondQuestions[0], currentPage);
      break;
    case 2:
      generateSurvey(surveyHtml, firstQuestions[1], secondQuestions[1], currentPage);
      break;
    case 3:
      generateSurvey(surveyHtml, firstQuestions[2], secondQuestions[2], currentPage);
      break;
    case 4:
      generateSurvey(surveyHtml, firstQuestions[3], secondQuestions[3], currentPage);
      break;
    default:
      break;
  }
}

function postSurvey(postData, endpointUrl, uuid, isComplete) {
  const httpMethod = uuid ? 'PUT' : 'POST';
  if (!uuid) {
    setUuid();
    uuid = getUuid();
  }
  const jsonPayload = {};
  jsonPayload[postData[0].name] = postData[0].value;
  if (postData[1].tagName.toLowerCase() === 'div') {
    const childNodeType = postData[1].childNodes[0].type;
    if (childNodeType === 'radio') {
      let selectedValue = 0;
      postData[1].childNodes.forEach(option => {
        if (option.checked) {
          selectedValue = option.value;
        }
      });
      jsonPayload.gender = selectedValue;
    } else if (childNodeType === 'checkbox') {
      const chosenColours = [];
      postData[1].childNodes.forEach(option => {
        if (option.checked) {
          chosenColours.push(option.value);
        }
      });
      jsonPayload.favourite_colours = chosenColours.join();
    }
  } else {
    jsonPayload[postData[1].name] = postData[1].value;
  }
  jsonPayload.uuid = uuid;
  if (isComplete) {
    jsonPayload.is_complete = true;
  }
  const request = new XMLHttpRequest();
  request.open(httpMethod, endpointUrl, true);
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify(jsonPayload));
}

function prevPage() {
  const currentPage = Number(getPage());
  if (currentPage === 1) {
    return;
  }
  setPage(currentPage - 1);
  drawSurveyPage(getPage());
}

function nextPage() {
  const currentPage = Number(getPage());
  if (currentPage === 4) {
    setPage(0);
    document.querySelector('.hotjar-survey').remove();
  } else {
    setPage(currentPage + 1);
    drawSurveyPage(getPage());
  }
}

document.addEventListener(
  'DOMContentLoaded',
  window.setTimeout(() => {
    if (getPage() === 0) {
      return;
    }
    drawSurveyPage(getPage());
    document.querySelector('.survey-prev').addEventListener('click', (e) => {
      e.preventDefault();
      prevPage();
    });
    document.querySelector('.survey-next').addEventListener('click', (e) => {
      e.preventDefault();
      noticeText.textContent = '';
      const firstSurveyInput = document.querySelector('.survey-first-input');
      const secondSurveyInput = document.querySelector('.survey-second-input');

      if ((firstSurveyInput.required && !firstSurveyInput.value)
        || (secondSurveyInput.required && !secondSurveyInput.value)) {
        noticeText.textContent = 'These fields are required';
        return;
      }

      const postData = [firstSurveyInput, secondSurveyInput];
      postSurvey(postData, API_ENDPOINT, getUuid(), getPage() === 4);
      nextPage();
    });
  }, 2000)
);
