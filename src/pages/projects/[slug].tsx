import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import ScrollBridge from '../../../components/ScrollBridge';
import type { GetStaticPaths, GetStaticProps } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const projectsDir = path.join(process.cwd(), 'content/projects');
  
  // Check if directory exists, if not return empty array
  if (!fs.existsSync(projectsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(projectsDir).filter(file => file.endsWith('.md'));
  
  return files.map(file => ({
    params: { slug: file.replace('.md', '') }
  }));
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params!;
  
  // Read the markdown scroll
  const scrollPath = path.join(process.cwd(), 'content/projects', `${slug}.md`);
  let scrollHtml = '';
  let signalJson = {};
  
  try {
    const scrollContent = fs.readFileSync(scrollPath, 'utf-8');
    scrollHtml = marked(scrollContent);
  } catch (error) {
    console.warn(`No scroll found for ${slug}`);
    scrollHtml = '<p>Project scroll not found.</p>';
  }
  
  // Read the AI meta JSON
  const metaPath = path.join(process.cwd(), 'content/ai-meta', `${slug}.json`);
  try {
    const metaContent = fs.readFileSync(metaPath, 'utf-8');
    signalJson = JSON.parse(metaContent);
  } catch (error) {
    console.warn(`No AI meta found for ${slug}`);
    signalJson = {
      project: slug,
      zone: 'unknown',
      purpose: 'Project details loading...',
      tags: [],
      scroll: `/content/projects/${slug}.md`
    };
  }
  
  return {
    props: {
      slug,
      scrollHtml,
      signalJson
    }
  };
};

interface ProjectPageProps {
  slug: string;
  scrollHtml: string;
  signalJson: any;
}

export default function ProjectPage({ slug, scrollHtml, signalJson }: ProjectPageProps) {
  // Create JSX element for the HTML content
  const scrollElement = <div dangerouslySetInnerHTML={{ __html: scrollHtml }} />;
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width" />
        <title>ScrollSpace - {slug}</title>
      </head>
      <body>
        <main>
          <ScrollBridge 
            scrollHtml={scrollElement}
            signalJson={signalJson}
          />
        </main>
      </body>
    </html>
  );
}