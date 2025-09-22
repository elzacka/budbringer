So I built an [AI newsletter](https://recap.aitools.inc/) that isn’t written by me — it’s completely written by an n8n workflow that I built. Each day, the system scrapes close to 100 AI news stories off the internet → saves the stories in a data lake as markdown file → and then runs those through this n8n workflow to generate a final newsletter that gets sent out to the subscribers.

I’ve been iterating on the main prompts used in this workflow over the past 5 months and have got it to the point where it is handling 95% of the process for writing each edition of the newsletter. It currently automatically handles:

- Scraping news stories sourced all over the internet from Twitter / Reddit / HackerNews / AI Blogs / Google News Feeds
    
- Loading all of those stories up and having an "AI Editor" pick the top 3-4 we want to feature in the newsletter
    
- Taking the source material and actually writing each core newsletter segment
    
- Writing all of the supplementary sections like the intro + a "Shortlist" section that includes other AI story links
    
- Formatting all of that output as markdown so it is easy to copy into Beehiiv and schedule with a few clicks
    

What started as an interesting pet project AI newsletter now has several thousand subscribers and has an open rate above 20%

## Data Ingestion Workflow Breakdown

This is the foundation of the newsletter system as I wanted complete control of where the stories are getting sourced from and need the content of each story in an easy to consume format like markdown so I can easily prompt against it. I wrote a bit more about this automation on this [reddit post](https://www.reddit.com/r/n8n/comments/1kzaysv/i_built_a_workflow_to_scrape_virtually_any_news/) but will cover the key parts again here:

1. The approach I took here involves creating a "feed" using RSS.app for every single news source I want to pull stories from (Twitter / Reddit / HackerNews / AI Blogs / Google News Feed / etc).
    
    1. Each feed I create gives an endpoint I can simply make an HTTP request to get a list of every post / content piece that rss.app was able to extract.
        
    2. With enough feeds configured, I’m confident that I’m able to detect every major story in the AI / Tech space for the day.
        
2. After a feed is created in rss.app, I wire it up to the n8n workflow on a Scheduled Trigger that runs every few hours to get the latest batch of news stories.
    
3. Once a new story is detected from that feed, I take that list of urls given back to me and start the process of scraping each one:
    
    1. This is done by calling into a `scrape_url` sub-workflow that I built out. This uses the Firecrawl API `/scrape` endpoint to scrape the contents of the news story and returns its text content back in markdown format
        
4. Finally, I take the markdown content that was scraped for each story and save it into an S3 bucket so I can later query and use this data when it is time to build the prompts that write the newsletter.
    

So by the end any given day with these scheduled triggers running across a dozen different feeds, I end up scraping close to 100 different AI news stories that get saved in an easy to use format that I will later prompt against.

## Newsletter Generator Workflow Breakdown

This workflow is the big one that actually loads up all scraped news content, picks the top stories, and writes the full newsletter.

### 1. Trigger / Inputs

- I use an n8n form trigger that simply let’s me pick the date I want to generate the newsletter for
    
- I can optionally pass in the previous day’s newsletter text content which gets loaded into the prompts I build to write the story so I can avoid duplicated stories on back to back days.
    

### 2. Loading Scraped News Stories from the Data Lake

Once the workflow is started, the first two sections are going to load up all of the news stories that were scraped over the course of the day. I do this by:

- Running a simple search operation on our S3 bucket prefixed by the date like: `2025-06-10/` (gives me all stories scraped on June 10th)
    
- Filtering these results to only give me back the markdown files that end in an `.md` extension (needed because I am also scraping and saving the raw HTML as well)
    
- Finally read each of these files and load the text content of each file and format it nicely so I can include that text in each prompt to later generate the newsletter.
    

### 3. AI Editor Prompt

With all of that text content in hand, I move on to the **AI Editor** section of the automation responsible for picking out the top 3-4 stories for the day relevant to the audience. This prompt is very specific to what I’m going for with this specific content, so if you want to build something similar you should expect _**a lot**_ of trial and error to get this to do what you want to. It's pretty beefy.

- Once the top stories are selected, that selection is shared in a slack channel using a "Human in the loop" approach where it will wait for me to approve the selected stories or provide feedback.
    
- For example, I may disagree with the top selected story on that day and I can type out in plain english to "Look for another story in the top spot, I don't like it for XYZ reason".
    
- The workflow will either look for my approval or take my feedback into consideration and try selecting the top stories again before continuing on.
    

### 4. Subject Line Prompt

Once the top stories are approved, the automation moves on to a very similar step for writing the subject line. It will give me its top selected option and 3-5 alternatives for me to review. Once again this get's shared to slack, and I can approve the selected subject line or tell it to use a different one in plain english.

### 5. Write “Core” Newsletter Segments

Next up, I move on to the part of the automation that is responsible for writing the "core" content of the newsletter. There's quite a bit going on here:

- The action inside this section of the workflow is to split out each of the stop news stories from before and start looping over them. This allows me to write each section one by one instead of needing a prompt to one-shot the entire thing. In my testing, I found this to follow my instructions / constraints in the prompt much better.
    
- For each top story selected, I have a list of "content identifiers" attached to it which corresponds to a file stored in the S3 bucket. Before I start writing, I go back to our S3 bucket and download each of these markdown files so the system is only looking at and passing in the relevant context when it comes time to prompt. The number of tokens used on the API calls to LLMs get very big when passing in all news stories to a prompt so this should be as focused as possible.
    
- With all of this context in hand, I then make the LLM call and run a mega-prompt that is setup to generate a single core newsletter section. The core newsletter sections follow a very structured format so this was relatively easier to prompt against (compared to picking out the top stories). If that is not the case for you, you may need to get a bit creative to vary the structure / final output.
    
- This process repeats until I have a newsletter section written out for each of the top selected stories for the day.
    

You may have also noticed there is a branch here that goes off and will conditionally try to scrape more URLs. We do this to try and scrape more “primary source” materials from any news story we have loaded into context.

Say Open AI releases a new model and the story we scraped was from Tech Crunch. It’s unlikely that tech crunch is going to give me all details necessary to really write something really good about the new model so I look to see if there’s a url/link included on the scraped page back to the Open AI blog or some other announcement post.

In short, I just want to get as many primary sources as possible here and build up better context for the main prompt that writes the newsletter section.

### 6. Final Touches (Final Nodes / Sections)

- I have a prompt to generate an intro section for the newsletter based off all of the previously generated content
    
    - I then have a prompt to generate a newsletter section called "The Shortlist" which creates a list of other AI stories that were interesting but didn't quite make the cut for top selected stories
        
- Lastly, I take the output from all previous node, format it as markdown, and then post it into an internal slack channel so I can copy this final output and paste it into the Beehiiv editor and schedule to send for the next morning.
    

## Workflow Link + Other Resources

- Github workflow links:
    
    - AI News Story / Data Ingestion Workflow: [https://github.com/lucaswalter/n8n-ai-workflows/blob/main/ai_news_data_ingestion.json](https://github.com/lucaswalter/n8n-ai-workflows/blob/main/ai_news_data_ingestion.json)
        
    - Firecrawl Scrape Url Sub-Workflow: [https://github.com/lucaswalter/n8n-ai-workflows/blob/main/firecrawl_scrape_url.json](https://github.com/lucaswalter/n8n-ai-workflows/blob/main/firecrawl_scrape_url.json)
        
    - AI Newsletter Generator Workflow: [https://github.com/lucaswalter/n8n-ai-workflows/blob/main/ai_newsletter_generator.json](https://github.com/lucaswalter/n8n-ai-workflows/blob/main/ai_newsletter_generator.json)
        
- YouTube video that walks through this workflow step-by-step: [https://www.youtube.com/watch?v=Nv5_LU0q1IY](https://www.youtube.com/watch?v=Nv5_LU0q1IY)