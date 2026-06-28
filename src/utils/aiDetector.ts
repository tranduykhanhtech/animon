declare const window: any;

let model: any = null;

export const loadAIModel = async () => {
  if (model) return model; // Đã tải rồi thì không tải lại
  try {
    if (!window.mobilenet) {
       console.log("Waiting for mobilenet library to load...");
       return null;
    }
    model = await window.mobilenet.load({ version: 2, alpha: 0.5 }); // Bản nhẹ nhất để chạy nhanh trên điện thoại
    console.log("AI Model loaded successfully!");
    return model;
  } catch (err) {
    console.error("Failed to load AI model", err);
    return null;
  }
};

// Từ khóa để kiểm tra xem có phải động vật không (rất rộng)
const animalKeywords = [
  'dog', 'cat', 'bird', 'fish', 'mouse', 'rat', 'horse', 'cow', 'pig', 'sheep', 
  'goat', 'chicken', 'duck', 'goose', 'turkey', 'rabbit', 'hare', 'deer', 'elk', 
  'moose', 'bear', 'lion', 'tiger', 'leopard', 'cheetah', 'elephant', 'rhino', 
  'hippo', 'giraffe', 'zebra', 'monkey', 'ape', 'gorilla', 'chimp', 'snake', 
  'lizard', 'turtle', 'tortoise', 'crocodile', 'alligator', 'frog', 'toad', 
  'spider', 'scorpion', 'crab', 'lobster', 'shrimp', 'butterfly', 'moth', 'bee', 
  'wasp', 'ant', 'beetle', 'fly', 'mosquito', 'worm', 'snail', 'slug', 'octopus', 
  'squid', 'jellyfish', 'starfish', 'shark', 'whale', 'dolphin', 'seal', 'walrus', 
  'penguin', 'ostrich', 'eagle', 'hawk', 'falcon', 'owl', 'parrot', 'pigeon', 
  'dove', 'hound', 'terrier', 'spaniel', 'retriever', 'collie', 'pug', 'bulldog', 
  'poodle', 'chihuahua', 'dachshund', 'beagle', 'boxer', 'mastiff', 'husky', 
  'malamute', 'shepherd', 'corgi', 'pointer', 'setter', 'weimaraner', 'dalmatian', 
  'greyhound', 'whippet', 'bloodhound', 'basset', 'pinscher', 'schnauzer', 'shiba', 
  'akita', 'chow', 'samoyed', 'newfoundland', 'bernese', 'saint bernard', 'rottweiler', 
  'doberman', 'great dane', 'bullmastiff', 'bull terrier', 'staffordshire', 'pit bull', 
  'macaque', 'baboon', 'orangutan', 'lemur', 'sloth', 'koala', 'kangaroo', 'wallaby', 
  'wombat', 'platypus', 'echidna', 'opossum', 'raccoon', 'skunk', 'badger', 'weasel', 
  'mink', 'otter', 'ferret', 'mongoose', 'meerkat', 'hyena', 'jackal', 'wolf', 
  'coyote', 'fox', 'dhole', 'wildcat', 'lynx', 'bobcat', 'puma', 'cougar', 'panther', 
  'jaguar', 'snow leopard', 'animal', 'pet', 'wildlife', 'creature', 'beast'
];

// Từ khóa phát hiện gian lận (chụp màn hình, đồ chơi, tranh ảnh)
const fakeKeywords = [
  'monitor', 'screen', 'television', 'laptop', 'computer', 'display', 'desktop',
  'teddy', 'plush', 'stuffed', 'doll', 'action figure', 'jigsaw', 'puzzle',
  'comic', 'book', 'paper', 'drawing', 'painting', 'sketch', 'art', 'sculpture', 'statue',
  'photograph', 'frame', 'picture', 'poster'
];

export const isAnimal = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<{ isAnimal: boolean, topGuess: string }> => {
  if (!model) {
    model = await loadAIModel();
    if (!model) return { isAnimal: true, topGuess: 'unknown' }; // Nếu lỗi AI, cho qua tạm
  }

  try {
    const predictions = await model.classify(imageElement);
    console.log("AI Predictions:", predictions);
    
    if (!predictions || predictions.length === 0) {
      return { isAnimal: false, topGuess: 'nothing' };
    }

    const topGuess = predictions[0].className;

    let isFake = false;
    let foundAnimal = false;

    for (const p of predictions) {
      const classes = p.className.toLowerCase().split(', ');
      
      // Kiểm tra xem có dấu hiệu gian lận không
      if (fakeKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return classes.some(cls => regex.test(cls));
      })) {
        isFake = true;
      }

      // Kiểm tra xem có phải động vật không
      if (animalKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return classes.some(cls => regex.test(cls));
      })) {
        foundAnimal = true;
      }
    }

    if (isFake) {
      return { isAnimal: false, topGuess: 'ảnh giả (màn hình/đồ chơi/tranh vẽ)' };
    }

    if (foundAnimal) {
      return { isAnimal: true, topGuess };
    }

    return { isAnimal: false, topGuess };
  } catch (error) {
    console.error("AI Classification error", error);
    return { isAnimal: true, topGuess: 'error' }; // Cho qua nếu AI bị crash
  }
};
