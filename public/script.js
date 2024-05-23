document.addEventListener('DOMContentLoaded', () => {
    fetchFaqs();

    async function fetchFaqs() {
        try {
            const response = await fetch('http://localhost:3000/api/faqs');
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            renderFaqs(data);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        }
    }

    function renderFaqs(faqs) {
        const faqList = document.getElementById('faqList');
        faqs.forEach(faq => {
            const faqItem = document.createElement('li');
            const faqButton = document.createElement('button');
            faqButton.textContent = faq.question;
            faqButton.id = faq.id;

            faqButton.addEventListener('click', async () => {
                const faqAnswer = document.createElement('p');
                faqAnswer.classList.add('error');
                try {
                    const answer = await getFaq(faq.id);
                    faqAnswer.textContent = answer;
                    faqAnswer.classList.remove('error');
                } catch (error) {
                    faqAnswer.textContent = 'Error fetching the answer';
                }
                faqItem.appendChild(faqAnswer);
            });

            faqItem.appendChild(faqButton);
            faqList.appendChild(faqItem);
        });
    }

    async function getFaq(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/faqs/${id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            return data.answer;
        } catch (error) {
            console.error('Error fetching FAQ:', error);
            throw error;
        }
    }
});
