window.APP_CONFIG = {
  supabaseUrl: 'https://hzejllwtsowkkawwxdqc.supabase.co/',
  supabaseAnonKey: 'sb_publishable_7VXAMk_joCrNFKSzJrnMJQ_8E7abVdi',
  quizmasterPassword: 'HAKUNAMATATA!',
  unlockRadiusMeters: 80,
  checkpoints: [
    {
      id: 1,
      name: 'CP 1 - C6',
      description: 'C6',
      funFact: "The feast is waiting, but first comes the pursuit! Solve this checkpoint's questions to begin the palace trail.",
      imageUrl: 'c6_fcul.jpg',
      imageFit: 'contain',
      mapAddress: 'Campo Grande 016, 1749-016 Lisboa',
      lat: 38.755280,
      lng: -9.157573,
      questions: [
        { id: 'q1', text: 'How many posters were there on the Workshop today?', type: 'multiple-choice', options: ['62', '60', '54', '52'], correctAnswer: '62' },
        { id: 'q2', text: 'CP1 question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q3', text: 'CP1 question 3?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' }
      ]
    },
    {
      id: 2,
      name: 'CP 2 - Palacete Pires Mendes',
      description: 'Palacete Pires Mendes',
      funFact: 'An ecletic-meets-art nouveau palace, .',
      imageUrl: 'pires_mendes.webp',
      imageFit: 'contain',
      mapAddress: 'Campo Grande 101, 1700-162 Lisboa',
      lat: 38.7526220,
      lng: -9.151514,
      questions: [
        { id: 'q4', text: 'CP2 question 1?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q5', text: 'CP2 question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q6', text: 'CP2 question 3?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' }
      ]
    },
    {
      id: 3,
      name: 'CP 3 - Jardim da Rotunda de Entrecampos',
      description: 'Jardim da Rotunda de Entrecampos',
      funFact: "In its center is the Monument to the People and Heroes of the Peninsular War, commemorating resistance to Napoleon’s invasions. But interestingly, while it was built in 1908 during Manuel II's reign, it was only inaugurated in 1933, during the Estado Novo.",
      imageUrl: 'entrecampos.jpg',
      mapAddress: 'Rotunda de Entrecampos, 1700-157 Lisboa',
      lat: 38.748640,
      lng: -9.148444,
      questions: [
        { id: 'q7', text: 'CP3 question 1?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q8', text: 'CP3 question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q9', text: 'CP3 question 3?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' }
      ]
    },
    {
      id: 4,
      name: 'CP 4 - Palacio das Vianinhas',
      description: 'Palácio das Vianinhas',
      funFact: 'Originally a banker’s suburban palace, became a Franciscan children’s and nursing institution, and now the headquarters of the national Misericórdia organization — while the old Entrecampos around it was completely transformed.',
      imageUrl: 'vianinhas.jpg',
      imageFit: 'contain',
      mapAddress: 'Rua de Entrecampos, nº 9, Lisboa',
      lat: 38.744235,
      lng: -9.144962,
      questions: [
        { id: 'q10', text: 'CP4 question 1?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q11', text: 'CP4 question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q12', text: 'CP4 question 3?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' }
      ]
    },
    {
      id: 5,
      name: 'CP 5 - Estatua Antonio Jose de Almeida',
      description: 'Estátua António José de Almeida',
      funFact: 'António José de Almeida, known as the Republic’s greatest orator, was the 6th President of the First Portuguese Republic and the only one to complete the full four-year term.',
      imageUrl: 'estatua.jpg',
      imageFit: 'contain',
      mapAddress: 'Av. de António José de Almeida, 1000-042 Lisboa',
      lat: 38.739970,
      lng: -9.142523,
      questions: [
        { id: 'q13', text: 'CP5 question 1?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q14', text: 'CP5 question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q15', text: 'CP5 question 3?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' }
      ]
    },
    {
      id: 6,
      name: "Final CP - Gula's",
      description: "Gula's for Kitchen Lovers",
      funFact: 'The palace trail ends here! After chasing monuments across Lisbon, the final stop brings the trail back to the table. But before that... ',
      imageUrl: 'gula.avif',
      mapAddress: 'R. Dona Filipa de Vilhena 18A, 1000-136 Lisboa',
      lat: 38.737295,
      lng: -9.141942,
      questions: [
        { id: 'q16', text: 'Final CP question 1?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q17', text: 'Final CP question 2?', type: 'multiple-choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
        { id: 'q18', text: 'How many diplomas were given today?', type: 'multiple-choice', options: ['42', '35', '62', '53'], correctAnswer: '62' }
      ]
    }
  ]
};
