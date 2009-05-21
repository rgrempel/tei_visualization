<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.w3.org/1999/xhtml" xmlns:str="http://exslt.org/strings"
    xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets"
    xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:data="http://www.pauldyck.com/data"
    xmlns:pd="http://www.pauldyck.com/" exclude-result-prefixes="data"
    xmlns:ext="http://extjs.com/"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    extension-element-prefixes="exsl str set" version="1.0">

    <xsl:output method="html" encoding="UTF-8" version="1.0" indent="yes"/>

    <!-- A default length for keyword-in-context context -->
    <xsl:param name="kwic-length" select="60"/>

    <!-- A prefix for id's ... mainly for embedding multiple documents -->
    <xsl:param name="id-prefix" select="''"/>

    <!-- This is for the tei:name mode=canonical -->
    <xsl:key name="roles" match="tei:role" use="@n"/>

    <!-- This is an attempt to come up with a unique method of identifying index term hierarchies ... -->
    <xsl:key name="terms" match="tei:index/tei:term"
        use="concat(count(ancestor::tei:index), ':', str:concat(ancestor::tei:index/tei:term))"/>

    <xsl:variable name="UC" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    <xsl:variable name="LC" select="'abcdefghijklmnopqrstuvwxyz'"/>

    <!-- By default, we just copy and descend -->
    <xsl:template name="copy-and-descend" match="*">
        <div class="{local-name(.)}">
            <xsl:apply-templates select="@*"/>
            <xsl:apply-templates/>
            <!-- If there are no children, we add some spurious stuff to avoid a browser bug -->
            <xsl:if test="count(* | text()) = 0">
                <xsl:comment>Empty tag</xsl:comment>
            </xsl:if>
        </div>
    </xsl:template>

    <!-- For attributes and text, we just copy -->
    <xsl:template match="text() | @*">
        <xsl:copy/>
    </xsl:template>

    <!-- Except for xml:id, which we do as Id, adding the prefix -->
    <xsl:template match="@xml:id">
        <xsl:attribute name="id">
            <xsl:value-of select="$id-prefix"/>
            <xsl:value-of select="."/>
        </xsl:attribute>
    </xsl:template>

    <!-- Given a node, a context, and a length, this template outputs the text which:
           * immediately precedes the node,
           * is within the context; and
           * is not longer than the length
           If it has to truncate the length, the template does it at a "space" character.
           Generally speaking, the context might be a paragraph ... it is an ancestor that
           you don't want the excerpt to go beyond. Note that the node must have text within
           it or this won't work ... I suppose it could be coded differently to work in that case.
           You could call it like this (in fact, this is probably the normal call):
               <xsl:call-template name="preceding-text">
                   <xsl:with-param name="node" select="." />
                   <xsl:with-param name="context" select="ancestor::p[1]" />
                   <xsl:with-param name="length" select="40" />
               </xsl:call-template>
    -->

    <xsl:template name="preceding-text">
        <xsl:param name="node" select="."/>
        <xsl:param name="context"
            select="($node/ancestor::*[self::tei:p | self::tei:l | self::tei:div])[1]"/>
        <xsl:param name="length" select="40"/>
        <!-- First we construct the entire text -->
        <xsl:variable name="raw-text">
            <!-- What we're doing here is finding all the text nodes that descend from the ancestor,
                and then picking out the ones that are before the first text node that descends from the node itself. -->
            <xsl:for-each
                select="set:leading($context/descendant::text(), $node/descendant::text())[not(ancestor::tei:index)]">
                <xsl:value-of select="."/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="text" select="normalize-space($raw-text)"/>
        <xsl:choose>
            <xsl:when test="string-length($text) > $length">
                <!-- When we need to truncate, we cut the beginning off, and then cut off everything up to the first space -->
                <xsl:value-of
                    select="substring-after(substring($text, string-length($text)-$length), ' ')"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$text"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- This outputs the part of a string which is before the last occurence of a substring ... unlike substring-before,
           which uses the first occurence of the substring ... -->
    <xsl:template name="substring-before-last">
        <xsl:param name="string"/>
        <xsl:param name="substring" select="' '"/>
        <xsl:choose>
            <xsl:when test="contains($string, $substring)">
                <xsl:value-of select="substring-before($string, $substring)"/>
                <xsl:value-of select="$substring"/>
                <xsl:call-template name="substring-before-last">
                    <xsl:with-param name="string" select="substring-after($string, $substring)"/>
                    <xsl:with-param name="substring" select="$substring"/>
                </xsl:call-template>
            </xsl:when>
        </xsl:choose>
    </xsl:template>

    <!-- Given a node, a context, and a length, this template outputs the text which:
        * immediately follows the node,
        * is within the context; and
        * is not longer than the length
        If it has to truncate the length, the template does it at a "space" character.
        Generally speaking, the context might be a paragraph ... it is an ancestor that
        you don't want the excerpt to go beyond. Note that the node must have text within
        it or this won't work ... I suppose it could be coded differently to work in that case.
        You could call it like this (in fact, this is probably the normal call):
            <xsl:call-template name="following-text">
                <xsl:with-param name="node" select="." />
                <xsl:with-param name="context" select="ancestor::p[1]" />
                <xsl:with-param name="length" select="40" />
            </xsl:call-template>
    -->

    <xsl:template name="following-text">
        <xsl:param name="node" select="."/>
        <xsl:param name="context"
            select="($node/ancestor::*[self::tei:p | self::tei:l | self::tei:div])[1]"/>
        <xsl:param name="length" select="40"/>
        <!-- First we construct the whole text -->
        <xsl:variable name="raw-text">
            <!-- Here we get all the text nodes within the context, and then pick out the ones that follow the node itself -->
            <xsl:for-each
                select="set:trailing($context/descendant::text(),
                ($node/descendant::text())[position() = last()])[not(ancestor::tei:index)]">
                <xsl:value-of select="."/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="text" select="normalize-space($raw-text)"/>
        <xsl:choose>
            <xsl:when test="string-length($text) > $length">
                <!-- If we need to truncate, we call substring-before-last to truncate at a "space" character -->
                <xsl:call-template name="substring-before-last">
                    <xsl:with-param name="string" select="substring($text, 1, $length)"/>
                    <xsl:with-param name="substring" select="' '"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$text"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="*" mode="kwic">
        <div class="kwic-entry" panelClass="MainPanel">
            <xsl:attribute name="scrollTo">
                <xsl:apply-templates select="." mode="id"/>
            </xsl:attribute>
            <!-- Then we put the preceding text into a <span> -->
            <span class="kwic-preceding">
              <xsl:variable name="preceding">
                <xsl:call-template name="preceding-text">
                    <xsl:with-param name="length" select="$kwic-length"/>
                </xsl:call-template>
              </xsl:variable>
              <xsl:if test="string-length(normalize-space($preceding)) = 0">
                <xsl:comment>Avoid bug</xsl:comment>
              </xsl:if>
              <xsl:value-of select="$preceding" />
            </span>
            <!-- Then we put the text itself in a different span ... perhaps bold? -->
            <span class="kwic-entry-text">
                <xsl:value-of select="."/>
            </span>
            <!-- Then we put the following text into another <span> -->
            <span class="kwic-following">
              <xsl:variable name="following">
                <xsl:call-template name="following-text">
                    <xsl:with-param name="length" select="$kwic-length"/>
                </xsl:call-template>
              </xsl:variable>
              <xsl:if test="string-length(normalize-space($following)) = 0">
                <xsl:comment>Avoid bug</xsl:comment>
              </xsl:if>
              <xsl:value-of select="$following" />
            </span>
        </div>
    </xsl:template>

    <xsl:template match="tei:index/tei:term" mode="kwic">
        <div class="kwic-entry" panelClass="MainPanel">
            <xsl:attribute name="scrollTo">
                <xsl:apply-templates select="." mode="id"/>
            </xsl:attribute>
            <!-- Then we put the preceding text into a <span> -->
            <span class="kwic-preceding">
              <xsl:variable name="preceding">
                <xsl:call-template name="preceding-text">
                    <xsl:with-param name="length" select="$kwic-length"/>
                    <xsl:with-param name="context" select="(ancestor::tei:div)[1]"/>
                </xsl:call-template>
              </xsl:variable>
              <xsl:if test="string-length(normalize-space($preceding)) = 0">
                <xsl:comment>Avoid bug</xsl:comment>
              </xsl:if>
              <xsl:value-of select="$preceding" />
            </span>
            <!-- Then we put the text itself in a different span ... perhaps bold? -->
            <span class="kwic-entry-text">
                <xsl:text>&lt;--&gt;</xsl:text>
            </span>
            <!-- Then we put the following text into another <span> -->
            <span class="kwic-following">
              <xsl:variable name="following">
                <xsl:call-template name="following-text">
                    <xsl:with-param name="length" select="$kwic-length"/>
                    <xsl:with-param name="context" select="(ancestor::tei:div)[1]"/>
                </xsl:call-template>
              </xsl:variable>
              <xsl:if test="string-length(normalize-space($following)) = 0">
                <xsl:comment>Avoid bug</xsl:comment>
              </xsl:if>
              <xsl:value-of select="$following" />
            </span>
        </div>
    </xsl:template>

    <!-- This is some markup for ref's -->
    <xsl:template match="tei:ref">
        <div class="ref">
            <xsl:attribute name="id">
                <xsl:value-of select="$id-prefix"/>
                <xsl:apply-templates select="." mode="id"/>
            </xsl:attribute>
            <xsl:apply-templates select="@*"/>
            <!-- If it is a ref to a glossary entry, then deal with it specially -->
            <xsl:variable name="glossary" select="(//tei:label[@xml:id = substring-after(current()/@target, '#')]/following-sibling::tei:item)[1]" />
            <xsl:choose>
                <xsl:when test="$glossary">
                    <xsl:attribute name="hover">
                        <xsl:value-of select="$glossary" />
                    </xsl:attribute>
                    <xsl:attribute name="panelClass">
                        <xsl:text>GlossaryPanel</xsl:text>
                    </xsl:attribute>
                    <xsl:attribute name="scrollTo">
                        <xsl:value-of select="substring-after(@target, '#')" />
                    </xsl:attribute>
                    <xsl:apply-templates />
                </xsl:when>
                <!-- Deal with internal links specially -->
                <xsl:when test="substring(@target, 1, 1) = '#'">
                    <xsl:attribute name="panelClass">
                      <xsl:text>MainPanel</xsl:text>
                    </xsl:attribute>
                    <xsl:attribute name="scrollTo">
                      <xsl:value-of select="substring-after(@target, '#')" />
                    </xsl:attribute>
                </xsl:when>
                <xsl:otherwise>
                    <a href="{@target}">
                        <xsl:apply-templates />
                    </a>
                </xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>

    <xsl:template match="tei:note" mode="note-panel-id">
        <xsl:text>note-panel-</xsl:text>
        <xsl:apply-templates select="." mode="id" />
    </xsl:template>
    
    <xsl:template match="tei:note">
        <span class="noteref" hover="{.}" panelClass="NotesPanel">
            <xsl:attribute name="scrollTo">
                <xsl:apply-templates select="." mode="note-panel-id" />
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:apply-templates select="." mode="id" />
            </xsl:attribute>
            <xsl:number level="any" />
        </span>
    </xsl:template>

    <!-- This is some markup to put id's on things we want to target -->
    <xsl:template match="tei:name | tei:rs | tei:div | *[@ana] | tei:said | tei:term">
        <div class="{local-name(.)}">
            <xsl:attribute name="id">
                <xsl:value-of select="$id-prefix"/>
                <xsl:apply-templates select="." mode="id"/>
            </xsl:attribute>
            <xsl:apply-templates select="@*"/>
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <xsl:template match="*" mode="id">
        <xsl:choose>
            <!-- If there is an xml:id, we use it ... -->
            <xsl:when test="@xml:id">
                <xsl:value-of select="@xml:id"/>
            </xsl:when>
            <xsl:otherwise>
                <!-- Sadly, we can't use generate-id, because it's different across runs
            (and the standard allows that). So we just count and recurse. -->
                <xsl:apply-templates select="parent::*" mode="id"/>
                <xsl:text>-c</xsl:text>
                <xsl:value-of select="count(preceding-sibling::*)"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="tei:div" mode="n">
        <xsl:choose>
            <xsl:when test="@n">
                <xsl:value-of select="@n"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates select="parent::tei:div" mode="n"/>
                <xsl:text>.</xsl:text>
                <xsl:value-of select="count(preceding-sibling::tei:div) + 1"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="tei:interp" mode="type">
        <xsl:choose>
            <xsl:when test="@type">
                <xsl:value-of select="@type"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="ancestor::tei:interpGrp/@type"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="tei:name" mode="canonical">
        <xsl:variable name="role" select="key('roles', @key)"/>
        <xsl:choose>
            <xsl:when test="$role">
                <xsl:value-of select="normalize-space($role)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="normalize-space(.)"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>
