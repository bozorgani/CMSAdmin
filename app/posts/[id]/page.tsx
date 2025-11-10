'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPost, createPost, updatePost } from '@/lib/api';
import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaSelector } from '@/components/MediaSelector';
import { listCategories, listTags, createCategory, createTag } from '@/lib/api';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export default function PostEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [publishPickerValue, setPublishPickerValue] = useState<any>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [showHtmlImportModal, setShowHtmlImportModal] = useState(false);
  const [htmlImportText, setHtmlImportText] = useState('');
  const [htmlContentToImport, setHtmlContentToImport] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: null as any,
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    publishAt: '',
    categoryId: '',
    categoryIds: [] as string[],
    tags: [] as string[],
    keywords: [] as string[],
    coverImageId: '',
    canonicalUrl: '',
    isFeatured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      robots: 'index, follow',
      ogTitle: '',
      ogDescription: '',
      ogImageId: '',
      twitterCard: 'summary_large_image',
      schemaType: 'Article',
      jsonLd: null as any
    }
  });

  useEffect(() => {
    if (!isNew) {
      loadPost();
    }
    loadCategories();
    loadTags();
  }, [id]);

  async function loadPost() {
    if (!id) return;
    const res = await getPost(id);
    if (res.ok && res.post) {
      const post = res.post;
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || null,
        status: post.status || 'draft',
        publishAt: post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : '',
        categoryId: typeof post.categoryId === 'string' ? post.categoryId : (post.categoryId?._id?.toString() || ''),
        categoryIds: Array.isArray(post.categoryIds)
          ? post.categoryIds.map((c: any) => (typeof c === 'string' ? c : (c?._id?.toString() || ''))).filter(Boolean)
          : [],
        tags: Array.isArray(post.tags)
          ? post.tags.map((t: any) => (typeof t === 'string' ? t : (t?._id?.toString() || ''))).filter(Boolean)
          : [],
        keywords: Array.isArray(post.keywords) ? post.keywords : [],
        coverImageId: typeof post.coverImageId === 'string' ? post.coverImageId : (post.coverImageId?._id?.toString() || ''),
        canonicalUrl: post.canonicalUrl || '',
        isFeatured: post.isFeatured || false,
        seo: {
          metaTitle: post.seo?.metaTitle || '',
          metaDescription: post.seo?.metaDescription || '',
          robots: post.seo?.robots || 'index, follow',
          ogTitle: post.seo?.ogTitle || '',
          ogDescription: post.seo?.ogDescription || '',
          ogImageId: typeof post.seo?.ogImageId === 'string' ? post.seo.ogImageId : (post.seo?.ogImageId?._id?.toString() || ''),
          twitterCard: post.seo?.twitterCard || 'summary_large_image',
          schemaType: post.seo?.schemaType || 'Article',
          jsonLd: post.seo?.jsonLd || null
        }
      });
      // Sync Persian picker with publishAt
      if (post.publishAt) {
        try {
          const d = new Date(post.publishAt);
          if (!isNaN(d.getTime())) setPublishPickerValue(d);
        } catch {}
      } else {
        setPublishPickerValue(null);
      }
    }
    setLoading(false);
  }

  async function loadCategories() {
    const res = await listCategories();
    if (res.ok && res.items) {
      setCategories(res.items);
    }
  }

  // Build hierarchical structure for categories
  const buildCategoryHierarchy = (cats: any[]) => {
    const categoryMap = new Map<string, any & { children?: any[] }>();
    const rootCategories: (any & { children?: any[] })[] = [];
    
    // First pass: create map
    cats.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });
    
    // Second pass: build hierarchy
    cats.forEach(cat => {
      const category = categoryMap.get(cat._id)!;
      if (cat.parentId && (cat.parentId._id || typeof cat.parentId === 'string')) {
        const parentId = typeof cat.parentId === 'string' ? cat.parentId : cat.parentId._id;
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };

  const hierarchicalCategories = buildCategoryHierarchy(categories);

  async function loadTags() {
    const res = await listTags();
    if (res.ok && res.items) setTags(res.items);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || creatingCategory) return;
    setCreatingCategory(true);
    try {
      const res = await createCategory({ name: newCategoryName.trim() });
      if (res.ok && res.category) {
        setCategories(prev => [...prev, res.category]);
        setFormData(prev => ({
          ...prev,
          categoryIds: [...prev.categoryIds, res.category._id]
        }));
        setNewCategoryName('');
        setCategorySearch('');
      } else {
        alert(res.error || 'خطا در ایجاد دسته‌بندی');
      }
    } catch (e) {
      alert('خطا در ایجاد دسته‌بندی');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim() || creatingTag) return;
    setCreatingTag(true);
    try {
      const res = await createTag({ name: newTagName.trim() });
      if (res.ok && res.tag) {
        setTags(prev => [...prev, res.tag]);
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, res.tag._id]
        }));
        setNewTagName('');
        setTagSearch('');
      } else {
        alert(res.error || 'خطا در ایجاد برچسب');
      }
    } catch (e) {
      alert('خطا در ایجاد برچسب');
    } finally {
      setCreatingTag(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seo: {
        ...prev.seo,
        metaTitle: prev.seo.metaTitle || title,
        ogTitle: prev.seo.ogTitle || title
      }
    }));
  }

  // Extract plain text from TipTap JSON content
  function extractTextFromContent(content: any): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (!content.content || !Array.isArray(content.content)) return '';
    
    let text = '';
    function traverse(node: any) {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
    content.content.forEach(traverse);
    return text.trim();
  }

  // Extract headings (H1, H2, H3) from TipTap JSON content
  function extractHeadingsFromContent(content: any): { h1: string[]; h2: string[]; h3: string[] } {
    if (!content) return { h1: [], h2: [], h3: [] };
    if (typeof content === 'string') return { h1: [], h2: [], h3: [] };
    if (!content.content || !Array.isArray(content.content)) return { h1: [], h2: [], h3: [] };
    
    const headings = { h1: [] as string[], h2: [] as string[], h3: [] as string[] };
    
    function traverse(node: any) {
      if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        let text = '';
        if (node.content && Array.isArray(node.content)) {
          function extractText(n: any) {
            if (n.type === 'text' && n.text) {
              text += n.text + ' ';
            }
            if (n.content && Array.isArray(n.content)) {
              n.content.forEach(extractText);
            }
          }
          node.content.forEach(extractText);
          text = text.trim();
          if (text) {
            if (level === 1) headings.h1.push(text);
            else if (level === 2) headings.h2.push(text);
            else if (level === 3) headings.h3.push(text);
          }
        }
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
    content.content.forEach(traverse);
    return headings;
  }

  const headings = extractHeadingsFromContent(formData.content);
  
  // Calculate SEO Score
  function calculateSeoScore(): { score: number; issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Title validation
    if (!formData.title || formData.title.length === 0) {
      issues.push('عنوان خالی است');
      score -= 20;
    } else if (formData.title.length < 50) {
      warnings.push('عنوان کمتر از 50 کاراکتر است');
      score -= 5;
    } else if (formData.title.length > 60) {
      warnings.push('عنوان بیش از 60 کاراکتر است');
      score -= 5;
    }

    // Slug validation
    if (!formData.slug || formData.slug.length === 0) {
      issues.push('اسلاگ خالی است');
      score -= 15;
    } else if (formData.slug.length > 60) {
      warnings.push('اسلاگ بیش از 60 کاراکتر است');
      score -= 5;
    }

    // Meta Title validation
    if (formData.seo.metaTitle) {
      if (formData.seo.metaTitle.length < 50) {
        warnings.push('Meta Title کمتر از 50 کاراکتر است');
        score -= 3;
      } else if (formData.seo.metaTitle.length > 60) {
        warnings.push('Meta Title بیش از 60 کاراکتر است');
        score -= 3;
      }
    }

    // Meta Description validation
    if (formData.seo.metaDescription) {
      if (formData.seo.metaDescription.length < 120) {
        warnings.push('Meta Description کمتر از 120 کاراکتر است');
        score -= 5;
      } else if (formData.seo.metaDescription.length > 160) {
        warnings.push('Meta Description بیش از 160 کاراکتر است');
        score -= 3;
      }
    }

    // OG Title validation
    if (formData.seo.ogTitle) {
      if (formData.seo.ogTitle.length < 40) {
        warnings.push('OG Title کمتر از 40 کاراکتر است');
        score -= 2;
      } else if (formData.seo.ogTitle.length > 60) {
        warnings.push('OG Title بیش از 60 کاراکتر است');
        score -= 2;
      }
    }

    // Content validation
    if (!formData.content) {
      issues.push('محتوا خالی است');
      score -= 25;
    }

    // H1 validation
    if (headings.h1.length === 0) {
      warnings.push('هیچ H1 در محتوا وجود ندارد');
      score -= 5;
    } else if (headings.h1.length > 1) {
      warnings.push(`بیش از یک H1 وجود دارد (${headings.h1.length} عدد) - باید فقط یک H1 باشد`);
      score -= 10;
    } else {
      const h1Text = headings.h1[0];
      if (h1Text.length < 20 || h1Text.length > 70) {
        warnings.push(`طول H1 مناسب نیست (${h1Text.length} کاراکتر) - باید 20-70 کاراکتر باشد`);
        score -= 3;
      }
    }

    // H2 validation
    headings.h2.forEach((h2, idx) => {
      if (h2.length < 10 || h2.length > 60) {
        warnings.push(`H2 شماره ${idx + 1} طول مناسبی ندارد (${h2.length} کاراکتر)`);
        score -= 1;
      }
    });

    // H3 validation
    headings.h3.forEach((h3, idx) => {
      if (h3.length < 10 || h3.length > 50) {
        warnings.push(`H3 شماره ${idx + 1} طول مناسبی ندارد (${h3.length} کاراکتر)`);
        score -= 1;
      }
    });

    // Keywords validation
    if (formData.keywords.length === 0) {
      warnings.push('کلمات کلیدی تعریف نشده است');
      score -= 3;
    }

    // Cover Image validation
    if (!formData.coverImageId) {
      warnings.push('تصویر شاخص انتخاب نشده است');
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));
    return { score, issues, warnings };
  }

  const seoScore = calculateSeoScore();

  // Persian and English stop words
  const stopWords = new Set([
    // Persian stop words
    'در', 'از', 'به', 'که', 'این', 'آن', 'با', 'برای', 'تا', 'را', 'یا', 'اگر', 'اما', 'هم', 'همه', 'یکی', 'دو', 'سه',
    'باشد', 'شده', 'شود', 'می', 'است', 'بود', 'هست', 'دارد', 'داشت', 'کرد', 'کرده', 'می‌شود', 'می‌باشد',
    'باشد', 'نیست', 'نبود', 'نشود', 'نمی', 'نباشد', 'نشده',
    // English stop words
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was',
    'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'there', 'then', 'than'
  ]);

  // Extract text from different sections
  function extractTextSections(content: any, title: string = '', excerpt: string = '') {
    const contentText = extractTextFromContent(content);
    const headings = extractHeadingsFromContent(content);
    
    return {
      title: title || '',
      excerpt: excerpt || '',
      h1: headings.h1.join(' '),
      h2: headings.h2.join(' '),
      h3: headings.h3.join(' '),
      content: contentText,
      firstParagraph: contentText.split(/\n+/)[0] || contentText.substring(0, 500),
      lastParagraph: contentText.split(/\n+/).filter(Boolean).pop() || contentText.substring(Math.max(0, contentText.length - 500)),
      fullText: [title, excerpt, contentText].filter(Boolean).join(' ')
    };
  }

  // Normalize text for analysis
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Tokenize text into words (removing stop words)
  function tokenize(text: string, removeStopWords: boolean = true): string[] {
    const normalized = normalizeText(text);
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    if (removeStopWords) {
      return words.filter(w => !stopWords.has(w));
    }
    return words;
  }

  // Find all occurrences of a keyword in text
  function findKeywordOccurrences(text: string, keyword: string): Array<{ index: number; context: string }> {
    const normalizedText = normalizeText(text);
    const normalizedKeyword = normalizeText(keyword);
    const occurrences: Array<{ index: number; context: string }> = [];
    
    if (!normalizedKeyword) return occurrences;
    
    // Escape special regex characters
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // For Persian/Arabic, we don't use word boundaries (they don't work well)
    // Instead, we match the keyword as-is, allowing for flexible whitespace
    const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 0);
    let regexPattern: RegExp;
    
    if (keywordWords.length === 1) {
      // Single word: match the word (allowing for Persian/Arabic text)
      regexPattern = new RegExp(escapedKeyword, 'gi');
    } else {
      // Multi-word: match as phrase with flexible whitespace
      const phrasePattern = keywordWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
      regexPattern = new RegExp(phrasePattern, 'gi');
    }
    
    let match;
    let lastIndex = 0;
    while ((match = regexPattern.exec(normalizedText)) !== null) {
      // Prevent infinite loop
      if (match.index === lastIndex) {
        regexPattern.lastIndex++;
        continue;
      }
      lastIndex = match.index;
      
      const index = match.index;
      const matchLength = match[0].length;
      
      // Extract context (100 characters before and after for better context)
      const contextSize = 100;
      const start = Math.max(0, index - contextSize);
      const end = Math.min(normalizedText.length, index + matchLength + contextSize);
      let context = normalizedText.substring(start, end);
      
      // Mark the keyword in context (simple highlighting)
      const keywordStart = index - start;
      const keywordEnd = keywordStart + matchLength;
      const beforeKeyword = context.substring(0, keywordStart);
      const keywordText = context.substring(keywordStart, keywordEnd);
      const afterKeyword = context.substring(keywordEnd);
      context = beforeKeyword + '【' + keywordText + '】' + afterKeyword;
      
      occurrences.push({
        index,
        context: (start > 0 ? '...' : '') + context + (end < normalizedText.length ? '...' : '')
      });
      
      // Move past this match
      regexPattern.lastIndex = index + matchLength;
    }
    
    return occurrences;
  }

  // Calculate keyword proximity (average distance between occurrences)
  function calculateProximity(occurrences: Array<{ index: number; context: string }>): number {
    if (occurrences.length < 2) return 0;
    
    const distances: number[] = [];
    for (let i = 1; i < occurrences.length; i++) {
      distances.push(occurrences[i].index - occurrences[i - 1].index);
    }
    
    return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  // Calculate TF-IDF (simplified - using term frequency only for now)
  function calculateTF(words: string[], keyword: string): number {
    const keywordWords = normalizeText(keyword).split(/\s+/);
    if (keywordWords.length === 1) {
      return words.filter(w => w === keywordWords[0]).length / words.length;
    } else {
      const phrase = keywordWords.join(' ');
      const text = words.join(' ');
      const matches = (text.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return matches / words.length;
    }
  }

  // Analyze keyword distribution across sections
  function analyzeKeywordDistribution(keyword: string, sections: ReturnType<typeof extractTextSections>) {
    const normalizedKeyword = normalizeText(keyword);
    
    return {
      inTitle: normalizeText(sections.title).includes(normalizedKeyword) ? 1 : 0,
      inExcerpt: normalizeText(sections.excerpt).includes(normalizedKeyword) ? 1 : 0,
      inH1: normalizeText(sections.h1).includes(normalizedKeyword) ? 1 : 0,
      inH2: normalizeText(sections.h2).includes(normalizedKeyword) ? 1 : 0,
      inH3: normalizeText(sections.h3).includes(normalizedKeyword) ? 1 : 0,
      inFirstParagraph: normalizeText(sections.firstParagraph).includes(normalizedKeyword) ? 1 : 0,
      inLastParagraph: normalizeText(sections.lastParagraph).includes(normalizedKeyword) ? 1 : 0,
      inContent: normalizeText(sections.content).includes(normalizedKeyword) ? 1 : 0
    };
  }

  // Generate SEO recommendations
  function generateSEORecommendations(keyword: string, analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.count === 0) {
      recommendations.push('کلمه کلیدی در محتوا یافت نشد - باید استفاده شود');
      return recommendations;
    }
    
    if (analysis.density < 0.5) {
      recommendations.push('چگالی بسیار پایین است - باید بیشتر استفاده شود');
    } else if (analysis.density > 3) {
      recommendations.push('چگالی بسیار بالا است - ممکن است اسپم تلقی شود');
    }
    
    if (!analysis.distribution.inTitle) {
      recommendations.push('کلمه کلیدی در عنوان استفاده نشده است');
    }
    
    if (!analysis.distribution.inH1 && analysis.distribution.inContent) {
      recommendations.push('کلمه کلیدی در H1 استفاده نشده است (توصیه می‌شود)');
    }
    
    if (!analysis.distribution.inFirstParagraph) {
      recommendations.push('کلمه کلیدی در پاراگراف اول استفاده نشده است (توصیه می‌شود)');
    }
    
    if (!analysis.distribution.inExcerpt) {
      recommendations.push('کلمه کلیدی در خلاصه (excerpt) استفاده نشده است');
    }
    
    if (analysis.occurrences.length === 1) {
      recommendations.push('کلمه کلیدی فقط یک بار استفاده شده است - باید بیشتر استفاده شود');
    }
    
    if (analysis.proximity > 0 && analysis.proximity < 100 && analysis.count > 2) {
      recommendations.push('کلمات کلیدی خیلی نزدیک به هم هستند - توزیع بهتر شود');
    }
    
    return recommendations;
  }

  // Advanced keyword analysis
  function calculateAdvancedKeywordAnalysis(
    keywords: string[], 
    content: any, 
    title: string = '', 
    excerpt: string = ''
  ): Array<{
    keyword: string;
    count: number;
    density: number;
    tf: number;
    distribution: ReturnType<typeof analyzeKeywordDistribution>;
    occurrences: Array<{ index: number; context: string }>;
    proximity: number;
    firstOccurrence: number;
    lastOccurrence: number;
    recommendations: string[];
    score: number; // SEO score for this keyword (0-100)
  }> {
    if (!keywords || keywords.length === 0) return [];
    
    const sections = extractTextSections(content, title, excerpt);
    if (!sections.fullText) return [];
    
    // Get all words (with and without stop words)
    const allWords = tokenize(sections.fullText, false);
    const wordsWithoutStopWords = tokenize(sections.fullText, true);
    const totalWords = wordsWithoutStopWords.length;
    
    if (totalWords === 0) return [];
    
    return keywords.map(keyword => {
      const normalizedKeyword = normalizeText(keyword.trim());
      if (!normalizedKeyword) {
        return {
          keyword,
          count: 0,
          density: 0,
          tf: 0,
          distribution: analyzeKeywordDistribution(keyword, sections),
          occurrences: [],
          proximity: 0,
          firstOccurrence: -1,
          lastOccurrence: -1,
          recommendations: ['کلمه کلیدی خالی است'],
          score: 0
        };
      }
      
      // Find all occurrences
      const occurrences = findKeywordOccurrences(sections.fullText, normalizedKeyword);
      const count = occurrences.length;
      
      // Also count in individual words for single-word keywords
      let actualCount = count;
      const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 0);
      if (keywordWords.length === 1 && count === 0) {
        // Fallback: count individual word matches if phrase matching didn't work
        actualCount = wordsWithoutStopWords.filter(w => w === keywordWords[0]).length;
      }
      
      // Calculate density (use count without stop words for more accurate density)
      const density = totalWords > 0 ? (actualCount / totalWords) * 100 : 0;
      
      // Calculate TF (Term Frequency)
      const tf = calculateTF(wordsWithoutStopWords, normalizedKeyword);
      
      // Analyze distribution
      const distribution = analyzeKeywordDistribution(keyword, sections);
      
      // Calculate proximity
      const proximity = calculateProximity(occurrences);
      
      // Find first and last occurrence positions (as percentage of text)
      const firstOccurrence = occurrences.length > 0 
        ? Math.round((occurrences[0].index / sections.fullText.length) * 100) 
        : -1;
      const lastOccurrence = occurrences.length > 0 
        ? Math.round((occurrences[occurrences.length - 1].index / sections.fullText.length) * 100) 
        : -1;
      
      // Generate recommendations (use actualCount)
      const recommendations = generateSEORecommendations(keyword, {
        count: actualCount,
        density,
        distribution,
        occurrences,
        proximity
      });
      
      // Calculate SEO score (0-100)
      let score = 100;
      
      // Density scoring
      if (density < 0.5) score -= 30;
      else if (density < 1) score -= 15;
      else if (density > 3) score -= 25;
      else if (density > 2) score -= 10;
      
      // Distribution scoring
      if (!distribution.inTitle) score -= 20;
      if (!distribution.inH1) score -= 15;
      if (!distribution.inFirstParagraph) score -= 10;
      if (!distribution.inExcerpt) score -= 5;
      if (!distribution.inH2 && !distribution.inH3) score -= 5;
      
      // Count scoring (use actualCount)
      if (actualCount === 0) score = 0;
      else if (actualCount === 1) score -= 20;
      else if (actualCount < 3) score -= 10;
      
      // Position scoring
      if (firstOccurrence > 30 && actualCount > 0) score -= 10; // Should appear in first 30% of text
      
      score = Math.max(0, Math.min(100, score));
      
      return {
        keyword,
        count: actualCount, // Use actualCount for display
        density: Math.round(density * 100) / 100,
        tf: Math.round(tf * 10000) / 100, // TF as percentage
        distribution,
        occurrences: occurrences.slice(0, 5), // Limit to first 5 for display
        proximity: Math.round(proximity),
        firstOccurrence,
        lastOccurrence,
        recommendations,
        score
      };
    });
  }

  const keywordDensity = calculateAdvancedKeywordAnalysis(
    formData.keywords, 
    formData.content, 
    formData.title, 
    formData.excerpt
  );

  // Parse full HTML document and extract all information
  function parseFullHtml(html: string) {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result: any = {
        title: '',
        metaDescription: '',
        keywords: [] as string[],
        canonicalUrl: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: '',
        ogLocale: '',
        jsonLd: null as any,
        content: '',
        excerpt: ''
      };

      // Extract title from <title> tag
      const titleTag = doc.querySelector('title');
      if (titleTag) {
        result.title = titleTag.textContent?.trim() || '';
      }

      // Extract meta description
      const metaDescription = doc.querySelector('meta[name="description"]');
      if (metaDescription) {
        result.metaDescription = metaDescription.getAttribute('content') || '';
      }

      // Extract keywords
      const metaKeywords = doc.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        const keywordsContent = metaKeywords.getAttribute('content') || '';
        result.keywords = keywordsContent
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      }

      // Extract canonical URL
      const canonical = doc.querySelector('link[rel="canonical"]');
      if (canonical) {
        result.canonicalUrl = canonical.getAttribute('href') || '';
      }

      // Extract Open Graph tags
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        result.ogTitle = ogTitle.getAttribute('content') || '';
      }

      const ogDescription = doc.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        result.ogDescription = ogDescription.getAttribute('content') || '';
      }

      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage) {
        result.ogImage = ogImage.getAttribute('content') || '';
      }

      const ogType = doc.querySelector('meta[property="og:type"]');
      if (ogType) {
        result.ogType = ogType.getAttribute('content') || '';
      }

      const ogUrl = doc.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        // Use og:url for canonical if canonical is not set
        if (!result.canonicalUrl) {
          result.canonicalUrl = ogUrl.getAttribute('content') || '';
        }
      }

      const ogLocale = doc.querySelector('meta[property="og:locale"]');
      if (ogLocale) {
        result.ogLocale = ogLocale.getAttribute('content') || '';
      }

      // Extract JSON-LD from script tags
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      if (jsonLdScripts.length > 0) {
        try {
          // Get the first JSON-LD script (or combine them if multiple)
          const jsonLdText = jsonLdScripts[0].textContent || '';
          if (jsonLdText.trim()) {
            result.jsonLd = JSON.parse(jsonLdText);
          }
          // If there are multiple JSON-LD scripts, you might want to combine them
          // For now, we'll use the first one
        } catch (error) {
          console.error('Error parsing JSON-LD:', error);
          // Continue without JSON-LD if parsing fails
        }
      }

      // Extract content from body
      // Try to find <article> first, then <main>, then <body>
      let contentElement = doc.querySelector('article');
      if (!contentElement) {
        contentElement = doc.querySelector('main');
      }
      if (!contentElement) {
        contentElement = doc.querySelector('body');
      }
      
      if (contentElement) {
        // Clone the element to avoid modifying the original
        const clonedElement = contentElement.cloneNode(true) as Element;
        
        // Remove header, footer, nav, and script/style tags
        const elementsToRemove = clonedElement.querySelectorAll('header, footer, nav, script, style, noscript');
        elementsToRemove.forEach(el => el.remove());
        
        // Extract excerpt from first paragraph (before removing anything)
        const firstP = clonedElement.querySelector('p');
        if (firstP) {
          result.excerpt = firstP.textContent?.trim().substring(0, 200) || '';
        }
        
        // Extract H1 for title if title is empty
        if (!result.title) {
          const h1 = clonedElement.querySelector('h1');
          if (h1) {
            result.title = h1.textContent?.trim() || '';
            // Optionally remove H1 from content if it's the same as title
            // (to avoid duplication)
          }
        }
        
        // Remove style attribute from the main container element only
        // (keep styles in child elements as they might be part of content)
        clonedElement.removeAttribute('style');
        clonedElement.removeAttribute('dir');
        clonedElement.removeAttribute('lang');
        
        // Get innerHTML of cleaned content
        result.content = clonedElement.innerHTML.trim();
        
        // Clean up empty paragraphs and extra whitespace
        result.content = result.content
          .replace(/<p>\s*<\/p>/g, '')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        
        // If content is still empty, try to get text content as fallback
        if (!result.content && clonedElement.textContent) {
          // Convert text to paragraphs
          const paragraphs = clonedElement.textContent
            .split(/\n\s*\n/)
            .filter(p => p.trim().length > 0)
            .map(p => `<p>${p.trim()}</p>`)
            .join('\n');
          result.content = paragraphs;
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing HTML:', error);
      throw new Error('خطا در parsing HTML: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Handle HTML import
  function handleImportHtml() {
    if (!htmlImportText.trim()) {
      alert('لطفا HTML را وارد کنید');
      return;
    }

    try {
      const parsed = parseFullHtml(htmlImportText);
      
      // Map og:type to schemaType
      const getSchemaType = (ogType: string, currentSchemaType: string): string => {
        if (!ogType) return currentSchemaType;
        // Map common og:type values to schema types
        const typeMap: Record<string, string> = {
          'article': 'Article',
          'Article': 'Article',
          'blog': 'BlogPosting',
          'BlogPosting': 'BlogPosting',
          'news': 'NewsArticle',
          'NewsArticle': 'NewsArticle',
        };
        return typeMap[ogType] || ogType || currentSchemaType;
      };

      // Update form data
      setFormData(prev => {
        const schemaType = getSchemaType(parsed.ogType, prev.seo.schemaType);
        
        return {
          ...prev,
          title: parsed.title || prev.title,
          slug: prev.slug || generateSlug(parsed.title || prev.title),
          excerpt: parsed.excerpt || prev.excerpt,
          keywords: parsed.keywords.length > 0 ? parsed.keywords : prev.keywords,
          canonicalUrl: parsed.canonicalUrl || prev.canonicalUrl,
          seo: {
            ...prev.seo,
            metaTitle: parsed.title || prev.seo.metaTitle,
            metaDescription: parsed.metaDescription || prev.seo.metaDescription,
            ogTitle: parsed.ogTitle || parsed.title || prev.seo.ogTitle,
            ogDescription: parsed.ogDescription || parsed.metaDescription || prev.seo.ogDescription,
            schemaType: schemaType,
            jsonLd: parsed.jsonLd || prev.seo.jsonLd,
          }
        };
      });

      // Set HTML content to import in editor
      if (parsed.content) {
        // Clean up HTML content - remove script and style tags for safety
        let cleanedContent = parsed.content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        // Set HTML content to trigger import in RichTextEditor
        setHtmlContentToImport(cleanedContent);
        
        // Close modal and clear input
        setHtmlImportText('');
        setShowHtmlImportModal(false);
        
        // Show success message with all extracted information
        setTimeout(() => {
          const ogInfo = [];
          if (parsed.ogTitle) ogInfo.push(`OG Title: ${parsed.ogTitle.substring(0, 50)}`);
          if (parsed.ogDescription) ogInfo.push(`OG Description: ${parsed.ogDescription.substring(0, 50)}`);
          if (parsed.ogImage) ogInfo.push(`OG Image: ${parsed.ogImage}`);
          if (parsed.ogType) ogInfo.push(`OG Type: ${parsed.ogType}`);
          if (parsed.ogLocale) ogInfo.push(`OG Locale: ${parsed.ogLocale}`);
          
          const message = `✅ HTML با موفقیت import شد!\n\n📋 اطلاعات استخراج شده:\n- عنوان: ${parsed.title || 'خالی'}\n- توضیحات: ${parsed.metaDescription?.substring(0, 50) || 'خالی'}...\n- کلمات کلیدی: ${parsed.keywords.length} عدد\n- Canonical URL: ${parsed.canonicalUrl || 'خالی'}\n${ogInfo.length > 0 ? '\n📱 Open Graph:\n' + ogInfo.map(info => '- ' + info).join('\n') : ''}\n\n✨ محتوا به ویرایشگر اضافه شد.${parsed.ogImage ? '\n\n⚠️ توجه: لطفا تصویر OG را از Media Library انتخاب کنید.' : ''}`;
          alert(message);
        }, 100);
      } else {
        setShowHtmlImportModal(false);
        alert('⚠️ محتوایی در HTML یافت نشد!');
      }
    } catch (error) {
      alert('خطا در import HTML: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async function handleSave() {
    // Validate before save
    const score = calculateSeoScore();
    if (score.issues.length > 0) {
      const confirmSave = confirm(
        `⚠️ مشکلات SEO وجود دارد:\n\n${score.issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\nآیا می‌خواهید باز هم ذخیره کنید?`
      );
      if (!confirmSave) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
        categoryId: formData.categoryId || undefined,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        coverImageId: formData.coverImageId || undefined,
        seo: {
          ...formData.seo,
          ogImageId: formData.seo.ogImageId || undefined,
          jsonLd: formData.seo.jsonLd || undefined
        }
      };
      
      const res = isNew 
        ? await createPost(payload)
        : await updatePost(id, payload);
      
      if (res.ok) {
        router.push('/posts');
      } else {
        alert(res.error || 'خطا در ذخیره');
      }
    } catch (e) {
      alert('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  }

  // no-op

  if (loading) {
    return <div className="p-6">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{isNew ? 'ایجاد پست جدید' : 'ویرایش پست'}</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">{isNew ? 'پست جدید خود را ایجاد کنید' : 'ویرایش و به‌روزرسانی پست'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push('/posts')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all text-sm lg:text-base whitespace-nowrap"
          >
            انصراف
          </button>
          {!isNew && (
            <button
              onClick={() => router.push(`/posts/${id}/preview`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm lg:text-base whitespace-nowrap"
            >
              👁️ پیش‌نمایش
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md text-sm lg:text-base whitespace-nowrap"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* فرم اصلی */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* اطلاعات پایه */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">اطلاعات پایه</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                عنوان (Title) *
                <span className="text-xs text-gray-500 font-normal mr-1">(50-60 کاراکتر توصیه می‌شود)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-md ${
                  formData.title.length > 0 && formData.title.length < 50 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : formData.title.length > 60 
                    ? 'border-red-300 bg-red-50' 
                    : formData.title.length >= 50 && formData.title.length <= 60
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                placeholder="عنوان پست (50-60 کاراکتر برای SEO بهینه است)"
                required
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.title.length > 0 && formData.title.length < 50 
                    ? 'text-yellow-600' 
                    : formData.title.length > 60 
                    ? 'text-red-600' 
                    : formData.title.length >= 50 && formData.title.length <= 60
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.title.length} کاراکتر
                  {formData.title.length > 0 && formData.title.length < 50 && (
                    <span className="mr-1">⚠️ کمتر از 50 کاراکتر</span>
                  )}
                  {formData.title.length > 60 && (
                    <span className="mr-1">⚠️ بیش از 60 کاراکتر - ممکن است در نتایج گوگل بریده شود</span>
                  )}
                  {formData.title.length >= 50 && formData.title.length <= 60 && (
                    <span className="mr-1">✅ طول مناسب برای SEO</span>
                  )}
                </p>
                {formData.title.length > 0 && (
                  <p className="text-xs text-gray-500">
                    💡 کلیدواژه اصلی را در ۳ کلمه اول بگذار
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                اسلاگ (URL / Permalink) *
                <span className="text-xs text-gray-500 font-normal mr-1">(حداکثر 60 کاراکتر، 3-5 کلمه)</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  // فقط حروف کوچک، اعداد، خط فاصله و خط زیر را اجازه بده
                  const sanitized = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\-_]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  setFormData(prev => ({ ...prev, slug: sanitized }));
                }}
                maxLength={60}
                className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
                  formData.slug.length > 60 
                    ? 'border-red-300 bg-red-50' 
                    : formData.slug.length > 0 && formData.slug.length <= 60
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                placeholder="learn-nextjs-seo"
                required
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.slug.length > 60 
                    ? 'text-red-600' 
                    : formData.slug.length > 0
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.slug.length} کاراکتر
                  {formData.slug.length > 60 && (
                    <span className="mr-1">⚠️ بیش از 60 کاراکتر - برای SEO بهینه نیست</span>
                  )}
                  {formData.slug.length > 0 && formData.slug.length <= 60 && (
                    <span className="mr-1">✅ طول مناسب</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  💡 فقط حروف کوچک، اعداد و خط فاصله (-)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">خلاصه (Excerpt)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="خلاصه کوتاه پست"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">محتوا *</label>
                <button
                  type="button"
                  onClick={() => setShowHtmlImportModal(true)}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  title="Import HTML کامل (با head و body)"
                >
                  📥 Import HTML کامل
                </button>
              </div>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                htmlContent={htmlContentToImport}
                onHtmlImported={() => setHtmlContentToImport('')}
              />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">تنظیمات SEO</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Title
                <span className="text-xs text-gray-500 font-normal mr-1">(50-60 کاراکتر)</span>
              </label>
              <input
                type="text"
                value={formData.seo.metaTitle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, metaTitle: e.target.value }
                }))}
                maxLength={70}
                className={`w-full px-3 py-2 border rounded-md ${
                  formData.seo.metaTitle.length > 0 && formData.seo.metaTitle.length < 50 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : formData.seo.metaTitle.length > 60 
                    ? 'border-red-300 bg-red-50' 
                    : formData.seo.metaTitle.length >= 50 && formData.seo.metaTitle.length <= 60
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                placeholder="عنوان برای SEO (50-60 کاراکتر برای نمایش کامل در نتایج گوگل)"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.seo.metaTitle.length > 0 && formData.seo.metaTitle.length < 50 
                    ? 'text-yellow-600' 
                    : formData.seo.metaTitle.length > 60 
                    ? 'text-red-600' 
                    : formData.seo.metaTitle.length >= 50 && formData.seo.metaTitle.length <= 60
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.seo.metaTitle.length} کاراکتر
                  {formData.seo.metaTitle.length > 0 && formData.seo.metaTitle.length < 50 && (
                    <span className="mr-1">⚠️ کمتر از 50 کاراکتر</span>
                  )}
                  {formData.seo.metaTitle.length > 60 && (
                    <span className="mr-1">⚠️ بیش از 60 کاراکتر - در نتایج گوگل بریده می‌شود</span>
                  )}
                  {formData.seo.metaTitle.length >= 50 && formData.seo.metaTitle.length <= 60 && (
                    <span className="mr-1">✅ طول مناسب</span>
                  )}
                </p>
                {formData.seo.metaTitle.length > 0 && (
                  <p className="text-xs text-gray-500">
                    💡 کلیدواژه اصلی را در ۳ کلمه اول بگذار
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Description
                <span className="text-xs text-gray-500 font-normal mr-1">(120-160 کاراکتر)</span>
              </label>
              <textarea
                value={formData.seo.metaDescription}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, metaDescription: e.target.value }
                }))}
                maxLength={180}
                className={`w-full px-3 py-2 border rounded-md ${
                  formData.seo.metaDescription.length > 0 && formData.seo.metaDescription.length < 120 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : formData.seo.metaDescription.length > 160 
                    ? 'border-red-300 bg-red-50' 
                    : formData.seo.metaDescription.length >= 120 && formData.seo.metaDescription.length <= 160
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                rows={3}
                placeholder="توضیحات برای SEO (120-160 کاراکتر برای نمایش کامل در snippets گوگل)"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.seo.metaDescription.length > 0 && formData.seo.metaDescription.length < 120 
                    ? 'text-yellow-600' 
                    : formData.seo.metaDescription.length > 160 
                    ? 'text-red-600' 
                    : formData.seo.metaDescription.length >= 120 && formData.seo.metaDescription.length <= 160
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.seo.metaDescription.length} کاراکتر
                  {formData.seo.metaDescription.length > 0 && formData.seo.metaDescription.length < 120 && (
                    <span className="mr-1">⚠️ کمتر از 120 کاراکتر - گوگل توضیح مفیدی نشان نمی‌دهد</span>
                  )}
                  {formData.seo.metaDescription.length > 160 && (
                    <span className="mr-1">⚠️ بیش از 160 کاراکتر - در snippets بریده می‌شود</span>
                  )}
                  {formData.seo.metaDescription.length >= 120 && formData.seo.metaDescription.length <= 160 && (
                    <span className="mr-1">✅ طول مناسب</span>
                  )}
                </p>
                {formData.seo.metaDescription.length > 0 && (
                  <p className="text-xs text-gray-500">
                    💡 با فعل و دعوت به اقدام بنویس (مثل "بیشتر بدانید")
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Robots</label>
              <select
                value={formData.seo.robots}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, robots: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Open Graph Title (Social Title)
                <span className="text-xs text-gray-500 font-normal mr-1">(40-60 کاراکتر)</span>
              </label>
              <input
                type="text"
                value={formData.seo.ogTitle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogTitle: e.target.value }
                }))}
                maxLength={80}
                className={`w-full px-3 py-2 border rounded-md ${
                  formData.seo.ogTitle.length > 0 && formData.seo.ogTitle.length < 40 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : formData.seo.ogTitle.length > 60 
                    ? 'border-red-300 bg-red-50' 
                    : formData.seo.ogTitle.length >= 40 && formData.seo.ogTitle.length <= 60
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                placeholder="عنوان برای شبکه‌های اجتماعی (40-60 کاراکتر برای کارت‌های لینک)"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.seo.ogTitle.length > 0 && formData.seo.ogTitle.length < 40 
                    ? 'text-yellow-600' 
                    : formData.seo.ogTitle.length > 60 
                    ? 'text-red-600' 
                    : formData.seo.ogTitle.length >= 40 && formData.seo.ogTitle.length <= 60
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.seo.ogTitle.length} کاراکتر
                  {formData.seo.ogTitle.length > 0 && formData.seo.ogTitle.length < 40 && (
                    <span className="mr-1">⚠️ کمتر از 40 کاراکتر</span>
                  )}
                  {formData.seo.ogTitle.length > 60 && (
                    <span className="mr-1">⚠️ بیش از 60 کاراکتر - ممکن است بریده شود</span>
                  )}
                  {formData.seo.ogTitle.length >= 40 && formData.seo.ogTitle.length <= 60 && (
                    <span className="mr-1">✅ طول مناسب برای شبکه‌های اجتماعی</span>
                  )}
                </p>
                {formData.seo.ogTitle.length > 0 && (
                  <p className="text-xs text-gray-500">
                    💡 عنوانی جذاب و کوتاه بنویس
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Open Graph Description (Social Description)
                <span className="text-xs text-gray-500 font-normal mr-1">(150-200 کاراکتر)</span>
              </label>
              <textarea
                value={formData.seo.ogDescription}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogDescription: e.target.value }
                }))}
                maxLength={220}
                className={`w-full px-3 py-2 border rounded-md ${
                  formData.seo.ogDescription.length > 0 && formData.seo.ogDescription.length < 150 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : formData.seo.ogDescription.length > 200 
                    ? 'border-red-300 bg-red-50' 
                    : formData.seo.ogDescription.length >= 150 && formData.seo.ogDescription.length <= 200
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                rows={2}
                placeholder="توضیحات برای شبکه‌های اجتماعی (150-200 کاراکتر)"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${
                  formData.seo.ogDescription.length > 0 && formData.seo.ogDescription.length < 150 
                    ? 'text-yellow-600' 
                    : formData.seo.ogDescription.length > 200 
                    ? 'text-red-600' 
                    : formData.seo.ogDescription.length >= 150 && formData.seo.ogDescription.length <= 200
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {formData.seo.ogDescription.length} کاراکتر
                  {formData.seo.ogDescription.length > 0 && formData.seo.ogDescription.length < 150 && (
                    <span className="mr-1">⚠️ کمتر از 150 کاراکتر</span>
                  )}
                  {formData.seo.ogDescription.length > 200 && (
                    <span className="mr-1">⚠️ بیش از 200 کاراکتر - ممکن است بریده شود</span>
                  )}
                  {formData.seo.ogDescription.length >= 150 && formData.seo.ogDescription.length <= 200 && (
                    <span className="mr-1">✅ طول مناسب</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Open Graph Image</label>
              <MediaSelector
                value={formData.seo.ogImageId}
                onChange={(id) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogImageId: id ?? '' }
                }))}
                label=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Twitter Card</label>
              <select
                value={formData.seo.twitterCard}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, twitterCard: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="summary">summary</option>
                <option value="summary_large_image">summary_large_image</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Schema Type</label>
              <select
                value={formData.seo.schemaType}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, schemaType: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Article">Article</option>
                <option value="BlogPosting">BlogPosting</option>
                <option value="NewsArticle">NewsArticle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Canonical URL</label>
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/post"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                JSON-LD (Structured Data)
                <span className="text-xs text-gray-500 font-normal mr-1">(اختیاری)</span>
              </label>
              <textarea
                value={formData.seo.jsonLd ? JSON.stringify(formData.seo.jsonLd, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const value = e.target.value.trim();
                    if (!value) {
                      setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, jsonLd: null }
                      }));
                      return;
                    }
                    const parsed = JSON.parse(value);
                    setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, jsonLd: parsed }
                    }));
                  } catch (error) {
                    // Invalid JSON - don't update state, but keep the text for editing
                    // User can fix the JSON
                  }
                }}
                onBlur={(e) => {
                  // Validate JSON on blur
                  try {
                    const value = e.target.value.trim();
                    if (value) {
                      JSON.parse(value);
                    }
                  } catch (error) {
                    alert('JSON نامعتبر است! لطفا JSON را اصلاح کنید.\n\nخطا: ' + (error instanceof Error ? error.message : String(error)));
                  }
                }}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                rows={8}
                placeholder='{"@context": "https://schema.org", "@type": "Article", ...}'
                dir="ltr"
                spellCheck={false}
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  💡 JSON-LD برای Structured Data (Schema.org). می‌توانید JSON کامل را اینجا وارد کنید.
                </p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    📋 مثال JSON-LD برای Article
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded border text-xs overflow-x-auto" dir="ltr">
{`{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "عنوان مقاله",
  "description": "توضیحات مقاله",
  "image": "https://example.com/image.jpg",
  "author": {
    "@type": "Person",
    "name": "نام نویسنده"
  },
  "publisher": {
    "@type": "Organization",
    "name": "نام سازمان"
  },
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-01"
}`}
                  </pre>
                </details>
                {formData.seo.jsonLd && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="text-green-700">✓ JSON معتبر است</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('آیا مطمئن هستید که می‌خواهید JSON-LD را پاک کنید؟')) {
                          setFormData(prev => ({
                            ...prev,
                            seo: { ...prev.seo, jsonLd: null }
                          }));
                        }
                      }}
                      className="mr-2 text-red-600 hover:text-red-800"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* کلمات کلیدی */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">کلمات کلیدی</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">کلمات کلیدی (جدا شده با کاما)</label>
              <textarea
                value={formData.keywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
                  setFormData(prev => ({ ...prev, keywords }));
                }}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="کلمه کلیدی ۱, کلمه کلیدی ۲, کلمه کلیدی ۳"
              />
              <p className="text-xs text-gray-500 mt-1">
                کلمات کلیدی را با کاما از هم جدا کنید
              </p>
            </div>

            {/* نمایش تحلیل پیشرفته کلمات کلیدی */}
            {keywordDensity.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">تحلیل پیشرفته کلمات کلیدی</h3>
                <div className="space-y-4">
                  {keywordDensity.map((item, idx) => {
                    const densityPercent = Math.min(item.density, 5); // Cap at 5% for visualization
                    const isOptimal = item.density >= 1 && item.density <= 3;
                    const isHigh = item.density > 3;
                    const isLow = item.density < 1;
                    const scoreColor = item.score >= 80 ? 'green' : item.score >= 60 ? 'yellow' : 'red';
                    
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-bold text-gray-900">{item.keyword}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                scoreColor === 'green' ? 'bg-green-100 text-green-700' :
                                scoreColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                امتیاز: {item.score}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>تعداد: <strong>{item.count}</strong> بار</span>
                              <span>چگالی: <strong>{item.density.toFixed(2)}%</strong></span>
                              <span>TF: <strong>{item.tf.toFixed(2)}%</strong></span>
                              {item.proximity > 0 && (
                                <span>فاصله متوسط: <strong>{item.proximity}</strong> کاراکتر</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Density Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              isOptimal ? 'bg-green-500' :
                              isHigh ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(densityPercent / 5) * 100}%` }}
                          />
                        </div>

                        {/* Distribution */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">توزیع کلمه کلیدی:</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div className={`text-xs p-2 rounded ${item.distribution.inTitle ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inTitle ? '✓' : '✗'} عنوان
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inH1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inH1 ? '✓' : '✗'} H1
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inExcerpt ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inExcerpt ? '✓' : '✗'} خلاصه
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inFirstParagraph ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inFirstParagraph ? '✓' : '✗'} پاراگراف اول
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inH2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inH2 ? '✓' : '✗'} H2
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inH3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inH3 ? '✓' : '✗'} H3
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inLastParagraph ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inLastParagraph ? '✓' : '✗'} پاراگراف آخر
                            </div>
                            <div className={`text-xs p-2 rounded ${item.distribution.inContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {item.distribution.inContent ? '✓' : '✗'} محتوا
                            </div>
                          </div>
                        </div>

                        {/* Position Info */}
                        {(item.firstOccurrence >= 0 || item.lastOccurrence >= 0) && (
                          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                            <p className="text-blue-800">
                              <strong>موقعیت:</strong> اولین استفاده در {item.firstOccurrence}% متن
                              {item.lastOccurrence >= 0 && ` | آخرین استفاده در ${item.lastOccurrence}% متن`}
                            </p>
                          </div>
                        )}

                        {/* Occurrences Preview */}
                        {item.occurrences.length > 0 && (
                          <details className="mb-3">
                            <summary className="text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                              نمایش موقعیت‌ها ({item.occurrences.length} مورد اول)
                            </summary>
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                              {item.occurrences.map((occ, occIdx) => (
                                <div key={occIdx} className="text-xs p-2 bg-white rounded border border-gray-200">
                                  <span className="text-gray-500">#{occIdx + 1}:</span> {occ.context}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        {/* Recommendations */}
                        {item.recommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-xs font-semibold text-gray-700 mb-2">توصیه‌های SEO:</p>
                            <ul className="space-y-1">
                              {item.recommendations.map((rec, recIdx) => (
                                <li key={recIdx} className="text-xs text-amber-700 flex items-start gap-1">
                                  <span>💡</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Status Message */}
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          {isOptimal && (
                            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                              <span>✅</span>
                              <span>چگالی مناسب - بهینه برای SEO</span>
                            </div>
                          )}
                          {isHigh && (
                            <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                              <span>⚠️</span>
                              <span>چگالی بالا - ممکن است اسپم تلقی شود</span>
                            </div>
                          )}
                          {isLow && (
                            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                              <span>❌</span>
                              <span>چگالی پایین - باید بیشتر استفاده شود</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">خلاصه آماری</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-700">میانگین امتیاز SEO:</span>
                      <strong className="mr-1">
                        {Math.round(keywordDensity.reduce((sum, item) => sum + item.score, 0) / keywordDensity.length)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-blue-700">میانگین چگالی:</span>
                      <strong className="mr-1">
                        {(keywordDensity.reduce((sum, item) => sum + item.density, 0) / keywordDensity.length).toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-blue-700">مجموع استفاده‌ها:</span>
                      <strong className="mr-1">
                        {keywordDensity.reduce((sum, item) => sum + item.count, 0)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-blue-700">کلمات بهینه:</span>
                      <strong className="mr-1 text-green-700">
                        {keywordDensity.filter(item => item.score >= 80).length} از {keywordDensity.length}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Guide */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>📊 راهنمای تحلیل پیشرفته:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li><strong>چگالی:</strong> درصد استفاده کلمه کلیدی نسبت به کل کلمات (بهینه: 1-3%)</li>
                    <li><strong>TF (Term Frequency):</strong> فرکانس ترم بدون در نظر گیری stop words</li>
                    <li><strong>توزیع:</strong> بررسی استفاده کلمه کلیدی در بخش‌های مختلف محتوا</li>
                    <li><strong>موقعیت:</strong> اولین و آخرین استفاده کلمه کلیدی در متن</li>
                    <li><strong>فاصله:</strong> متوسط فاصله بین استفاده‌های متوالی کلمه کلیدی</li>
                    <li><strong>امتیاز SEO:</strong> امتیاز کلی کلمه کلیدی بر اساس معیارهای SEO (0-100)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* سایدبار */}
        <div className="space-y-4 lg:space-y-6">
          {/* SEO Score Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">وضعیت SEO</h2>
            
            {/* Score Display */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${
                seoScore.score >= 80 
                  ? 'bg-green-100 text-green-700' 
                  : seoScore.score >= 60 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {seoScore.score}
              </div>
              <p className="text-sm text-gray-600 mt-2">امتیاز SEO</p>
            </div>

            {/* Issues */}
            {seoScore.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-red-600">مشکلات:</h3>
                <ul className="space-y-1">
                  {seoScore.issues.map((issue, idx) => (
                    <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                      <span>❌</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {seoScore.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-yellow-600">هشدارها:</h3>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {seoScore.warnings.map((warning, idx) => (
                    <li key={idx} className="text-xs text-yellow-600 flex items-start gap-1">
                      <span>⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {seoScore.issues.length === 0 && seoScore.warnings.length === 0 && seoScore.score > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 text-center">
                  ✅ همه چیز بهینه است!
                </p>
              </div>
            )}

            {/* Headings Summary */}
            {(headings.h1.length > 0 || headings.h2.length > 0 || headings.h3.length > 0) && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-semibold">ساختار محتوا:</h3>
                {headings.h1.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold">H1:</span> {headings.h1.length} عدد
                    {headings.h1.length === 1 && (
                      <div className="text-gray-600 mt-1 truncate" title={headings.h1[0]}>
                        "{headings.h1[0].substring(0, 40)}{headings.h1[0].length > 40 ? '...' : ''}"
                        <span className="text-gray-500 mr-1">({headings.h1[0].length} کاراکتر)</span>
                      </div>
                    )}
                  </div>
                )}
                {headings.h2.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold">H2:</span> {headings.h2.length} عدد
                  </div>
                )}
                {headings.h3.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold">H3:</span> {headings.h3.length} عدد
                  </div>
                )}
                {headings.h1.length === 0 && (
                  <p className="text-xs text-yellow-600">⚠️ هیچ H1 در محتوا وجود ندارد</p>
                )}
                {headings.h1.length > 1 && (
                  <p className="text-xs text-red-600">❌ بیش از یک H1 وجود دارد - باید فقط یک H1 باشد</p>
                )}
              </div>
            )}
          </div>

          {/* انتشار */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">انتشار</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">وضعیت</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">پیش‌نویس</option>
                <option value="scheduled">زمان‌بندی شده</option>
                <option value="published">منتشر شده</option>
              </select>
            </div>

            {(formData.status === 'scheduled' || formData.status === 'published') && (
              <div>
                <label className="block text-sm font-medium mb-1">تاریخ انتشار</label>
              <DatePicker
                value={publishPickerValue}
                onChange={(val: any) => {
                  setPublishPickerValue(val || null);
                  if (!val) {
                    setFormData(prev => ({ ...prev, publishAt: '' }));
                    return;
                  }
                  const v = Array.isArray(val) ? val[0] : val;
                  try {
                    // v.toDate() returns Gregorian JS Date
                    const jsDate = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
                    if (jsDate && !isNaN(jsDate.getTime())) {
                      setFormData(prev => ({ ...prev, publishAt: jsDate.toISOString() }));
                    }
                  } catch {}
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD HH:mm"
                plugins={[<TimePicker position="bottom" />]}
                className="w-full"
                style={{ width: '100%' }}
              />
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">پست ویژه</span>
            </label>
          </div>

          {/* تصویر شاخص */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">تصویر شاخص</h2>
            <MediaSelector
              value={formData.coverImageId}
              onChange={(id) => setFormData(prev => ({ ...prev, coverImageId: id ?? '' }))}
              label=""
            />
          </div>

          {/* دسته‌بندی */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">دسته‌بندی‌ها</h2>
              <span className="text-xs text-gray-500">
                {formData.categoryIds.length} انتخاب شده
              </span>
            </div>
            
            {/* جستجو */}
            <div>
              <input
                type="text"
                placeholder="جستجو در دسته‌بندی‌ها..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* ایجاد دسته‌بندی جدید */}
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="نام دسته‌بندی جدید..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      handleCreateCategory();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creatingCategory}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {creatingCategory ? '...' : '+ افزودن'}
                </button>
              </div>
            </div>

            {/* لیست دسته‌بندی‌ها */}
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
              {(() => {
                // Filter categories based on search
                const filtered = categorySearch
                  ? hierarchicalCategories.filter(cat => {
                      const matchesMain = cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                        cat.slug.toLowerCase().includes(categorySearch.toLowerCase());
                      const matchesChildren = cat.children?.some((child: any) => 
                        child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        child.slug.toLowerCase().includes(categorySearch.toLowerCase())
                      );
                      return matchesMain || matchesChildren;
                    })
                  : hierarchicalCategories;

                if (filtered.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4">دسته‌بندی‌ای یافت نشد</p>
                  );
                }

                const renderCategory = (cat: any, level = 0): JSX.Element | null => {
                  const isMainCategory = !cat.parentId || (typeof cat.parentId === 'object' && !cat.parentId._id);
                  const isSelected = formData.categoryIds.includes(cat._id);
                  const hasSelectedChild = cat.children?.some((child: any) => formData.categoryIds.includes(child._id));

                  return (
                    <div key={cat._id} className="space-y-1">
                      <label 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isMainCategory 
                            ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                        style={{ marginRight: level > 0 ? `${level * 1.5}rem` : '0' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, cat._id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: prev.categoryIds.filter(c => c !== cat._id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {level > 0 && (
                            <span className="text-gray-400 text-xs">└─</span>
                          )}
                          {isMainCategory && (
                            <span className="text-blue-600 text-sm">📂</span>
                          )}
                          {!isMainCategory && (
                            <span className="text-gray-500 text-xs">•</span>
                          )}
                          <span className={`text-sm flex-1 ${isMainCategory ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {cat.name}
                          </span>
                          {isMainCategory && cat.children && cat.children.length > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {cat.children.length} زیردسته
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-blue-600 text-sm font-bold">✓</span>
                        )}
                        {hasSelectedChild && !isSelected && (
                          <span className="text-blue-400 text-xs">○</span>
                        )}
                      </label>
                      {/* Render children */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="space-y-1">
                          {cat.children
                            .filter((child: any) => {
                              if (!categorySearch) return true;
                              return child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                     child.slug.toLowerCase().includes(categorySearch.toLowerCase());
                            })
                            .map((child: any) => renderCategory(child, level + 1))
                            .filter(Boolean)}
                        </div>
                      )}
                    </div>
                  );
                };

                return filtered.map(cat => renderCategory(cat)).filter(Boolean);
              })()}
            </div>
          </div>

          {/* برچسب‌ها */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">برچسب‌ها</h2>
              <span className="text-xs text-gray-500">
                {formData.tags.length} انتخاب شده
              </span>
            </div>

            {/* جستجو */}
            <div>
              <input
                type="text"
                placeholder="جستجو در برچسب‌ها..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* ایجاد برچسب جدید */}
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="نام برچسب جدید..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTagName.trim()) {
                      handleCreateTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {creatingTag ? '...' : '+ افزودن'}
                </button>
              </div>
            </div>

            {/* لیست برچسب‌ها */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tags
                .filter(tag => 
                  tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
                  tag.slug.toLowerCase().includes(tagSearch.toLowerCase())
                )
                .map((tag) => (
                  <label key={tag._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag._id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            tags: prev.tags.filter(t => t !== tag._id)
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm flex-1">{tag.name}</span>
                    {formData.tags.includes(tag._id) && (
                      <span className="text-xs text-blue-600">✓</span>
                    )}
                  </label>
                ))}
              {tags.filter(tag => 
                tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
                tag.slug.toLowerCase().includes(tagSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">برچسبی یافت نشد</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HTML Import Modal */}
      {showHtmlImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Import HTML کامل</h3>
                <p className="text-sm text-gray-600 mt-1">
                  HTML کامل صفحه (با DOCTYPE، head، body) را paste کنید. اطلاعات به‌طور خودکار استخراج می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHtmlImportModal(false);
                  setHtmlImportText('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={htmlImportText}
                onChange={(e) => setHtmlImportText(e.target.value)}
                className="w-full min-h-[400px] p-4 border-2 border-gray-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>عنوان</title>&#10;    <meta name=&quot;description&quot; content=&quot;...&quot; />&#10;  </head>&#10;  <body>&#10;    <article>&#10;      <h1>عنوان</h1>&#10;      <p>محتوا...</p>&#10;    </article>&#10;  </body>&#10;</html>"
                dir="ltr"
                spellCheck={false}
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                  lineHeight: '1.5'
                }}
              />
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 mb-2">
                  <strong>💡 اطلاعاتی که استخراج می‌شود:</strong>
                </p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>عنوان از &lt;title&gt; یا &lt;h1&gt;</li>
                  <li>Meta Description</li>
                  <li>Keywords</li>
                  <li>Canonical URL (از &lt;link rel="canonical"&gt; یا og:url)</li>
                  <li>Open Graph Tags:
                    <ul className="list-disc list-inside mr-4 mt-1 space-y-0.5">
                      <li>og:title</li>
                      <li>og:description</li>
                      <li>og:image</li>
                      <li>og:type (تبدیل به Schema Type)</li>
                      <li>og:url (استفاده برای Canonical)</li>
                      <li>og:locale</li>
                    </ul>
                  </li>
                  <li>JSON-LD از &lt;script type="application/ld+json"&gt;</li>
                  <li>محتوا از &lt;article&gt;، &lt;main&gt; یا &lt;body&gt;</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlImportModal(false);
                  setHtmlImportText('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleImportHtml}
                disabled={!htmlImportText.trim()}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Import و استخراج اطلاعات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
