FEED_SOURCES = [
    # ---------- Dev.to (tag feeds) ----------
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/java", "is_community": True, "topics": ["java"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/springboot", "is_community": True, "topics": ["java", "spring_boot"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/spring", "is_community": True, "topics": ["java", "spring_boot"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/hibernate", "is_community": True, "topics": ["java"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/mongodb", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/kafka", "is_community": True, "topics": ["kafka"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/ai", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/llm", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/chatgpt", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/claude", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/cursor", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/copilot", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/microservices", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/backend", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/programming", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/devops", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/docker", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/kubernetes", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/aws", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/security", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/testing", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed", "is_community": True},

    # ---------- Medium (tag feeds) ----------
    {"name": "Medium", "url": "https://medium.com/feed/tag/java", "is_community": True, "topics": ["java"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/spring-boot", "is_community": True, "topics": ["java", "spring_boot"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/spring", "is_community": True, "topics": ["java", "spring_boot"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/hibernate", "is_community": True, "topics": ["java"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/mongodb", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/kafka", "is_community": True, "topics": ["kafka"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/apache-kafka", "is_community": True, "topics": ["kafka"]},
    {"name": "Medium", "url": "https://medium.com/feed/tag/microservices", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/ai", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/artificial-intelligence", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/llm", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/chatgpt", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/claude", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/cursor", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/github-copilot", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/ai-tools", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/programming", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/software-development", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/devops", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/docker", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/kubernetes", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/aws", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/security", "is_community": True},

    # ---------- Reddit (subreddit RSS) ----------
    {"name": "Reddit", "url": "https://www.reddit.com/r/java/.rss", "is_community": True, "topics": ["java"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/SpringBoot/.rss", "is_community": True, "topics": ["java", "spring_boot"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/javahelp/.rss", "is_community": True, "topics": ["java"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/mongodb/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/apachekafka/.rss", "is_community": True, "topics": ["kafka"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/ClaudeAI/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/cursor/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/LocalLLaMA/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/MachineLearning/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/programming/.rss", "is_community": True},

    # ---------- Hacker News (via hnrss.org) ----------
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=java+spring", "is_news": True, "topics": ["java"]},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=spring+boot", "is_news": True, "topics": ["java", "spring_boot"]},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=mongodb", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=kafka", "is_news": True, "topics": ["kafka"]},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=claude+ai", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=cursor+ai", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=llm", "is_news": True},

    # ---------- InfoQ ----------
    {"name": "InfoQ", "url": "https://feed.infoq.com/", "is_news": True},

    # ---------- Baeldung (Java/Spring focused) ----------
    {"name": "Baeldung", "url": "https://www.baeldung.com/feed/", "is_tutorial": True, "topics": ["java"]},

    # ---------- Spring.io blog ----------
    {"name": "Spring.io", "url": "https://spring.io/blog.atom", "is_official": True, "topics": ["java", "spring_boot"]},

    # ---------- Java Official Blogs ----------
    {"name": "Inside Java", "url": "https://inside.java/feed.xml", "is_official": True, "topics": ["java"]},
    {"name": "Java Code Geeks", "url": "https://feeds.feedburner.com/JavaCodeGeeks", "is_tutorial": True, "topics": ["java"]},
    {"name": "Reflectoring.io", "url": "https://reflectoring.io/index.xml", "is_tutorial": True, "topics": ["java", "spring_boot"]},
    {"name": "Piotr's TechBlog", "url": "https://piotrminkowski.com/feed/", "is_tutorial": True, "topics": ["java", "spring_boot"]},
    {"name": "Thorben Janssen", "url": "https://thorben-janssen.com/feed/", "is_tutorial": True, "topics": ["java"]},

    # ---------- Kafka & System Design Blogs ----------
    {"name": "Confluent Blog", "url": "https://www.confluent.io/rss.xml", "is_official": True, "topics": ["kafka"]},
    {"name": "Jack Vanlightly", "url": "https://jack-vanlightly.com/blog?format=rss", "is_official": True},

    # ---------- DevOps & Cloud Blogs ----------
    {"name": "Docker Blog", "url": "https://www.docker.com/blog/feed/", "is_official": True},
    {"name": "Kubernetes Blog", "url": "https://kubernetes.io/feed.xml", "is_official": True},
    {"name": "CNCF Blog", "url": "https://www.cncf.io/feed/", "is_official": True},
    {"name": "Learnk8s", "url": "https://learnk8s.io/rss.xml", "is_tutorial": True},
    {"name": "Giant Swarm", "url": "https://www.giantswarm.io/blog/rss.xml", "is_official": True},
    {"name": "Sysdig Blog", "url": "https://sysdig.com/feed/", "is_news": True},
    {"name": "AWS News Blog", "url": "https://aws.amazon.com/blogs/aws/feed/", "is_official": True, "is_news": True},
    {"name": "AWS Architecture", "url": "https://aws.amazon.com/blogs/architecture/feed/", "is_official": True},
    {"name": "AWS DevOps Blog", "url": "https://aws.amazon.com/blogs/devops/feed/", "is_official": True},
    {"name": "AWS Security Blog", "url": "https://aws.amazon.com/blogs/security/feed/", "is_official": True},
    {"name": "The Burning Monk", "url": "https://theburningmonk.com/feed/", "is_tutorial": True},
    {"name": "Last Week in AWS", "url": "https://www.lastweekinaws.com/feed/", "is_news": True},
    {"name": "Azure Blog", "url": "https://azure.microsoft.com/en-us/blog/feed/", "is_official": True},
    {"name": "Microsoft DevOps", "url": "https://devblogs.microsoft.com/devops/feed/", "is_official": True},
    {"name": "Google Cloud Blog", "url": "https://cloudblog.withgoogle.com/rss/", "is_official": True},
    {"name": "HashiCorp Blog", "url": "https://www.hashicorp.com/blog/feed.xml", "is_official": True},
    {"name": "SRE Weekly", "url": "https://sreweekly.com/feed/", "is_news": True},

    # ---------- Database Blogs ----------
    {"name": "MongoDB Eng Blog", "url": "https://www.mongodb.com/blog/rss", "is_official": True},
    {"name": "PostgreSQL Weekly", "url": "https://postgresweekly.com/rss/", "is_news": True},
    {"name": "Redis Blog", "url": "https://redis.io/blog/feed/", "is_official": True},

    # ---------- AI & LLM Blogs ----------
    {"name": "OpenAI Blog", "url": "https://openai.com/news/rss.xml", "is_official": True},
    {"name": "Hugging Face", "url": "https://huggingface.co/blog/feed.xml", "is_tutorial": True},
    {"name": "Google Research", "url": "https://research.google/blog/rss/", "is_official": True},
    {"name": "Lilian Weng", "url": "https://lilianweng.github.io/index.xml", "is_tutorial": True},

    # ---------- Architecture & General Engineering Blogs ----------
    {"name": "Netflix Tech Blog", "url": "https://netflixtechblog.com/feed", "is_official": True},
    {"name": "GitHub Engineering", "url": "https://github.blog/engineering/feed/", "is_official": True},
    {"name": "Discord Eng Blog", "url": "https://discord.com/blog/rss.xml", "is_official": True},
    {"name": "ByteByteGo", "url": "https://blog.bytebytego.com/feed", "is_tutorial": True},
    {"name": "Martin Fowler", "url": "https://martinfowler.com/feed.atom", "is_official": True},

    # ---------- Security & Software Quality Blogs ----------
    {"name": "Krebs on Security", "url": "https://krebsonsecurity.com/feed/", "is_news": True},
    {"name": "Troy Hunt", "url": "https://www.troyhunt.com/feed/", "is_tutorial": True},
    {"name": "PortSwigger Blog", "url": "https://portswigger.net/blog/rss", "is_news": True},
    {"name": "Kent Beck", "url": "https://tidyfirst.substack.com/feed", "is_tutorial": True},

    # ---------- Big Tech (official newsrooms & developer blogs) ----------
    {"name": "Apple Newsroom", "url": "https://www.apple.com/newsroom/rss-feed.rss", "is_official": True, "is_news": True},
    {"name": "Apple Developer", "url": "https://developer.apple.com/news/rss/news.rss", "is_official": True},
    {"name": "Google Blog", "url": "https://blog.google/rss/", "is_official": True, "is_news": True},
    {"name": "Android Developers", "url": "https://developer.android.com/static/blog/atom.xml", "is_official": True},
    {"name": "Microsoft Blog", "url": "https://blogs.microsoft.com/feed/", "is_official": True, "is_news": True},
    {"name": "Windows Blog", "url": "https://blogs.windows.com/feed/", "is_official": True},
    {"name": "Samsung Newsroom", "url": "https://news.samsung.com/global/feed", "is_official": True, "is_news": True},
    {"name": "Meta Engineering", "url": "https://engineering.fb.com/feed/", "is_official": True},
    {"name": "NVIDIA Blog", "url": "https://blogs.nvidia.com/feed/", "is_official": True},

    # ---------- Gadgets: phones, laptops & hardware news ----------
    {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml", "is_news": True},
    {"name": "Engadget", "url": "https://www.engadget.com/rss.xml", "is_news": True},
    {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "is_news": True},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/", "is_news": True},
    {"name": "9to5Mac", "url": "https://9to5mac.com/feed/", "is_news": True},
    {"name": "MacRumors", "url": "https://feeds.macrumors.com/MacRumors-All", "is_news": True},
    {"name": "9to5Google", "url": "https://9to5google.com/feed/", "is_news": True},
    {"name": "Android Authority", "url": "https://www.androidauthority.com/feed/", "is_news": True},
    {"name": "GSMArena", "url": "https://www.gsmarena.com/rss-news-reviews.php3", "is_news": True},
    {"name": "XDA Developers", "url": "https://www.xda-developers.com/feed/", "is_news": True},
    {"name": "Notebookcheck", "url": "https://www.notebookcheck.net/RSS-Feed-Notebook-Reviews.8156.0.html", "is_news": True},
    {"name": "Tom's Hardware", "url": "https://www.tomshardware.com/feeds.xml", "is_news": True},

    # ---------- Stacks: Python / FastAPI / Django ----------
    {"name": "Real Python", "url": "https://realpython.com/atom.xml", "is_tutorial": True, "topics": ["python"]},
    {"name": "Python Insider", "url": "https://blog.python.org/feeds/posts/default", "is_official": True, "topics": ["python"]},
    {"name": "Planet Python", "url": "https://planetpython.org/rss20.xml", "is_community": True, "topics": ["python"]},
    {"name": "TestDriven.io", "url": "https://testdriven.io/feed.xml", "is_tutorial": True, "topics": ["python"]},
    {"name": "Django Blog", "url": "https://www.djangoproject.com/rss/weblog/", "is_official": True, "topics": ["python", "django"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/fastapi", "is_community": True, "topics": ["python", "fastapi"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/python", "is_community": True, "topics": ["python"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/FastAPI/.rss", "is_community": True, "topics": ["python", "fastapi"]},

    # ---------- Stacks: Node.js / NestJS ----------
    {"name": "Node.js Blog", "url": "https://nodejs.org/en/feed/blog.xml", "is_official": True, "topics": ["nodejs"]},
    {"name": "Node Weekly", "url": "https://cprss.s3.amazonaws.com/nodeweekly.com.xml", "is_news": True, "topics": ["nodejs"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/node", "is_community": True, "topics": ["nodejs"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/nestjs", "is_community": True, "topics": ["nodejs", "nestjs"]},

    # ---------- Stacks: Go ----------
    {"name": "Go Blog", "url": "https://go.dev/blog/feed.atom", "is_official": True, "topics": ["golang"]},
    {"name": "Golang Weekly", "url": "https://cprss.s3.amazonaws.com/golangweekly.com.xml", "is_news": True, "topics": ["golang"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/go", "is_community": True, "topics": ["golang"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/golang/.rss", "is_community": True, "topics": ["golang"]},

    # ---------- Stacks: C# / .NET ----------
    {"name": ".NET Blog", "url": "https://devblogs.microsoft.com/dotnet/feed/", "is_official": True, "topics": ["dotnet"]},
    {"name": "Andrew Lock", "url": "https://andrewlock.net/rss.xml", "is_tutorial": True, "topics": ["dotnet"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/dotnet", "is_community": True, "topics": ["dotnet"]},

    # ---------- Stacks: React / Next.js ----------
    {"name": "React Blog", "url": "https://react.dev/rss.xml", "is_official": True, "topics": ["react"]},
    {"name": "Next.js Blog", "url": "https://nextjs.org/feed.xml", "is_official": True, "topics": ["react", "nextjs"]},
    {"name": "This Week in React", "url": "https://thisweekinreact.com/newsletter/rss.xml", "is_news": True, "topics": ["react"]},
    {"name": "Josh Comeau", "url": "https://www.joshwcomeau.com/rss.xml", "is_tutorial": True, "topics": ["react", "web_platform"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/react", "is_community": True, "topics": ["react"]},

    # ---------- Stacks: Angular ----------
    {"name": "Angular Blog", "url": "https://blog.angular.dev/feed", "is_official": True, "topics": ["angular"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/angular", "is_community": True, "topics": ["angular"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/Angular2/.rss", "is_community": True, "topics": ["angular"]},

    # ---------- Stacks: Vue / Nuxt ----------
    {"name": "Vue Blog", "url": "https://blog.vuejs.org/feed.rss", "is_official": True, "topics": ["vue"]},
    {"name": "Nuxt Blog", "url": "https://nuxt.com/blog/rss.xml", "is_official": True, "topics": ["vue"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/vue", "is_community": True, "topics": ["vue"]},

    # ---------- Stacks: Svelte ----------
    {"name": "Svelte Blog", "url": "https://svelte.dev/blog/rss.xml", "is_official": True, "topics": ["svelte"]},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/svelte", "is_community": True, "topics": ["svelte"]},
    {"name": "Reddit", "url": "https://www.reddit.com/r/sveltejs/.rss", "is_community": True, "topics": ["svelte"]},

    # ---------- Stacks: Web basics (HTML, CSS, TypeScript) ----------
    {"name": "web.dev", "url": "https://web.dev/feed.xml", "is_official": True, "topics": ["web_platform"]},
    {"name": "CSS-Tricks", "url": "https://css-tricks.com/feed/", "is_tutorial": True, "topics": ["web_platform"]},
    {"name": "Smashing Magazine", "url": "https://www.smashingmagazine.com/feed/", "is_tutorial": True, "topics": ["web_platform"]},
    {"name": "Frontend Focus", "url": "https://cprss.s3.amazonaws.com/frontendfoc.us.xml", "is_news": True, "topics": ["web_platform"]},
    {"name": "JavaScript Weekly", "url": "https://cprss.s3.amazonaws.com/javascriptweekly.com.xml", "is_news": True},
]
