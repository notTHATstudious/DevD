FEED_SOURCES = [
    # ---------- Dev.to (tag feeds) ----------
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/java", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/springboot", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/spring", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/hibernate", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/mongodb", "is_community": True},
    {"name": "Dev.to", "url": "https://dev.to/feed/tag/kafka", "is_community": True},
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
    {"name": "Medium", "url": "https://medium.com/feed/tag/java", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/spring-boot", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/spring", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/hibernate", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/mongodb", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/kafka", "is_community": True},
    {"name": "Medium", "url": "https://medium.com/feed/tag/apache-kafka", "is_community": True},
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
    {"name": "Reddit", "url": "https://www.reddit.com/r/java/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/SpringBoot/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/javahelp/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/mongodb/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/apachekafka/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/ClaudeAI/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/cursor/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/LocalLLaMA/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/MachineLearning/.rss", "is_community": True},
    {"name": "Reddit", "url": "https://www.reddit.com/r/programming/.rss", "is_community": True},

    # ---------- Hacker News (via hnrss.org) ----------
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=java+spring", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=spring+boot", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=mongodb", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=kafka", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=claude+ai", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=cursor+ai", "is_news": True},
    {"name": "Hacker News", "url": "https://hnrss.org/newest?q=llm", "is_news": True},

    # ---------- InfoQ ----------
    {"name": "InfoQ", "url": "https://feed.infoq.com/", "is_news": True},

    # ---------- Baeldung (Java/Spring focused) ----------
    {"name": "Baeldung", "url": "https://www.baeldung.com/feed/", "is_tutorial": True},

    # ---------- Spring.io blog ----------
    {"name": "Spring.io", "url": "https://spring.io/blog.atom", "is_official": True},

    # ---------- Java Official Blogs ----------
    {"name": "Inside Java", "url": "https://inside.java/feed.xml", "is_official": True},
    {"name": "Java Code Geeks", "url": "https://feeds.feedburner.com/JavaCodeGeeks", "is_tutorial": True},
    {"name": "Reflectoring.io", "url": "https://reflectoring.io/index.xml", "is_tutorial": True},
    {"name": "Piotr's TechBlog", "url": "https://piotrminkowski.com/feed/", "is_tutorial": True},
    {"name": "Thorben Janssen", "url": "https://thorben-janssen.com/feed/", "is_tutorial": True},

    # ---------- Kafka & System Design Blogs ----------
    {"name": "Confluent Blog", "url": "https://www.confluent.io/rss.xml", "is_official": True},
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
]
