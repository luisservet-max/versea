export interface Poem {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  isUserPoem?: boolean;
  createdAt: string;
}

export const featuredPoems: Poem[] = [
  {
    id: "1",
    title: "The Road Not Taken",
    author: "Robert Frost",
    excerpt: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both...",
    content: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same,\n\nAnd both that morning equally lay\nIn leaves no step had trodden black.\nOh, I kept the first for another day!\nYet knowing how way leads on to way,\nI doubted if I should ever come back.\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.",
    tags: ["classic", "nature", "life"],
    likes: 2431,
    comments: 187,
    createdAt: "1916-01-01",
  },
  {
    id: "2",
    title: "Still I Rise",
    author: "Maya Angelou",
    excerpt: "You may write me down in history\nWith your bitter, twisted lies...",
    content: "You may write me down in history\nWith your bitter, twisted lies,\nYou may trod me in the very dirt\nBut still, like dust, I'll rise.\n\nDoes my sassiness upset you?\nWhy are you beset with gloom?\n'Cause I walk like I've got oil wells\nPumping in my living room.\n\nJust like moons and like suns,\nWith the certainty of tides,\nJust like hopes springing high,\nStill I'll rise.",
    tags: ["empowerment", "resilience", "classic"],
    likes: 3102,
    comments: 243,
    createdAt: "1978-01-01",
  },
  {
    id: "3",
    title: "Do Not Go Gentle into That Good Night",
    author: "Dylan Thomas",
    excerpt: "Do not go gentle into that good night,\nOld age should burn and rave at close of day...",
    content: "Do not go gentle into that good night,\nOld age should burn and rave at close of day;\nRage, rage against the dying of the light.\n\nThough wise men at their end know dark is right,\nBecause their words had forked no lightning they\nDo not go gentle into that good night.\n\nGood men, the last wave by, crying how bright\nTheir frail deeds might have danced in a green bay,\nRage, rage against the dying of the light.",
    tags: ["classic", "mortality", "defiance"],
    likes: 1893,
    comments: 156,
    createdAt: "1951-01-01",
  },
  {
    id: "4",
    title: "Hope is the thing with feathers",
    author: "Emily Dickinson",
    excerpt: "Hope is the thing with feathers\nThat perches in the soul...",
    content: "Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all,\n\nAnd sweetest in the gale is heard;\nAnd sore must be the storm\nThat could abash the little bird\nThat kept so many warm.\n\nI've heard it in the chillest land,\nAnd on the strangest sea;\nYet, never, in extremity,\nIt asked a crumb of me.",
    tags: ["hope", "nature", "classic"],
    likes: 2105,
    comments: 178,
    createdAt: "1891-01-01",
  },
  {
    id: "5",
    title: "Invictus",
    author: "William Ernest Henley",
    excerpt: "Out of the night that covers me,\nBlack as the pit from pole to pole...",
    content: "Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.\n\nIn the fell clutch of circumstance\nI have not winced nor cried aloud.\nUnder the bludgeonings of chance\nMy head is bloody, but unbowed.\n\nBeyond this place of wrath and tears\nLooms but the Horror of the shade,\nAnd yet the menace of the years\nFinds and shall find me unafraid.\n\nIt matters not how strait the gate,\nHow charged with punishments the scroll,\nI am the master of my fate,\nI am the captain of my soul.",
    tags: ["courage", "resilience", "classic"],
    likes: 2780,
    comments: 201,
    createdAt: "1875-01-01",
  },
  {
    id: "6",
    title: "Whispers at Dusk",
    author: "Elena Morales",
    excerpt: "The sky bleeds amber through the pines,\nA quiet hymn the evening signs...",
    content: "The sky bleeds amber through the pines,\nA quiet hymn the evening signs.\nI hold the silence like a prayer,\nAnd taste the coolness in the air.\n\nThe world retreats on gentle feet,\nWhere shadow and the starlight meet.\nI am the pause between two breaths—\nA comma resting before depth.",
    tags: ["nature", "contemplation", "modern"],
    likes: 342,
    comments: 28,
    isUserPoem: true,
    createdAt: "2024-09-15",
  },
];

export const tags = [
  "classic", "modern", "nature", "love", "life", "hope",
  "resilience", "mortality", "empowerment", "contemplation",
  "courage", "defiance", "heartbreak", "joy", "solitude",
];
