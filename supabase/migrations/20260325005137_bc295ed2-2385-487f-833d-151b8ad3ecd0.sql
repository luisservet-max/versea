CREATE TABLE public.classic_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  bio text,
  birth_year integer,
  death_year integer,
  nationality text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classic_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read classic authors"
  ON public.classic_authors FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed some well-known classic authors
INSERT INTO public.classic_authors (name, bio, birth_year, death_year, nationality) VALUES
('William Shakespeare', 'English playwright and poet, widely regarded as the greatest writer in the English language. His works include sonnets, comedies, tragedies, and histories that have been performed and studied for over four centuries.', 1564, 1616, 'English'),
('Emily Dickinson', 'American poet known for her unconventional use of form and syntax. She lived a largely reclusive life in Amherst, Massachusetts, and most of her nearly 1,800 poems were published posthumously.', 1830, 1886, 'American'),
('Robert Frost', 'American poet known for his realistic depictions of rural life and his command of American colloquial speech. His work frequently employed settings from rural life in New England to examine complex social and philosophical themes.', 1874, 1963, 'American'),
('Walt Whitman', 'American poet, essayist, and journalist. A humanist, he was a part of the transition between transcendentalism and realism. His work "Leaves of Grass" is a landmark in American poetry.', 1819, 1892, 'American'),
('Edgar Allan Poe', 'American writer, poet, editor, and literary critic, best known for his poetry and short stories of mystery and the macabre. He is widely regarded as a central figure of Romanticism and Gothic fiction.', 1809, 1849, 'American'),
('Langston Hughes', 'American poet, social activist, novelist, and playwright. He was one of the earliest innovators of the literary art form called jazz poetry and best known as a leader of the Harlem Renaissance.', 1901, 1967, 'American'),
('Pablo Neruda', 'Chilean poet-diplomat and politician who won the Nobel Prize for Literature in 1971. He wrote in a variety of styles, including surrealist poems, historical epics, and love poems.', 1904, 1973, 'Chilean'),
('Federico García Lorca', 'Spanish poet, playwright, and theatre director. He is considered one of the most important Spanish-language poets of the 20th century. His poetry drew on Andalusian folk traditions.', 1898, 1936, 'Spanish'),
('William Wordsworth', 'English Romantic poet who helped launch the Romantic Age in English literature with the joint publication of "Lyrical Ballads" with Samuel Taylor Coleridge.', 1770, 1850, 'English'),
('Maya Angelou', 'American poet, memoirist, and civil rights activist. She published seven autobiographies, three books of essays, and several books of poetry, and is credited with a list of plays, movies, and television shows.', 1928, 2014, 'American'),
('Rumi', 'Persian poet, scholar, and Sufi mystic. His poems have been widely translated into many of the world''s languages and he has been described as the most popular poet in the United States.', 1207, 1273, 'Persian'),
('William Butler Yeats', 'Irish poet and one of the foremost figures of 20th-century literature. He was a pillar of the Irish literary establishment and helped found the Abbey Theatre.', 1865, 1939, 'Irish'),
('Sylvia Plath', 'American poet, novelist, and short-story writer. Known primarily for her poetry, she also wrote a semi-autobiographical novel "The Bell Jar." She is credited with advancing confessional poetry.', 1932, 1963, 'American'),
('John Keats', 'English Romantic poet. He is one of the key figures of the second generation of Romantic poets, along with Lord Byron and Percy Bysshe Shelley. His poetry is known for its vivid imagery and great sensual appeal.', 1795, 1821, 'English'),
('Lord Byron', 'British poet and leading figure in the Romantic movement. Among his best-known works are the lengthy narrative poems "Don Juan" and "Childe Harold''s Pilgrimage."', 1788, 1824, 'English'),
('Percy Bysshe Shelley', 'English Romantic poet regarded as one of the finest lyric poets in the English language. He is best known for his works including "Ozymandias", "Ode to the West Wind", and "To a Skylark."', 1792, 1822, 'English'),
('Oscar Wilde', 'Irish poet and playwright. Known for his wit, flamboyance, and brilliant conversational skill, he wrote numerous short stories, one novel, and several plays.', 1854, 1900, 'Irish'),
('Elizabeth Barrett Browning', 'English poet of the Victorian era. Her poetry was widely popular during her lifetime and influenced prominent writers including Emily Dickinson and Edgar Allan Poe.', 1806, 1861, 'English'),
('T.S. Eliot', 'American-English poet, essayist, publisher, playwright, and literary critic. Considered one of the 20th century''s major poets, he is known for "The Waste Land" and "The Love Song of J. Alfred Prufrock."', 1888, 1965, 'American-English'),
('Robert Burns', 'Scottish poet and lyricist widely regarded as the national poet of Scotland. He is the best known of the poets who have written in the Scots language.', 1759, 1796, 'Scottish')
ON CONFLICT (name) DO NOTHING;