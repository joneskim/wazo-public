--
-- PostgreSQL database dump
--

-- Dumped from database version 15.10 (Homebrew)
-- Dumped by pg_dump version 15.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: joneskim
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO joneskim;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: joneskim
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Note; Type: TABLE; Schema: public; Owner: joneskim
--

CREATE TABLE public."Note" (
    id text NOT NULL,
    content text NOT NULL,
    created_at text NOT NULL,
    last_modified text NOT NULL,
    tags text DEFAULT '[]'::text NOT NULL,
    code_outputs text DEFAULT '{}'::text NOT NULL,
    backlinks text DEFAULT '[]'::text NOT NULL,
    "references" text DEFAULT '[]'::text NOT NULL,
    suggested_links text DEFAULT '[]'::text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public."Note" OWNER TO joneskim;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: joneskim
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL,
    priority text NOT NULL,
    due_date text,
    created_at text NOT NULL,
    last_modified text NOT NULL,
    tags text DEFAULT '[]'::text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public."Task" OWNER TO joneskim;

--
-- Name: User; Type: TABLE; Schema: public; Owner: joneskim
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO joneskim;

--
-- Name: _NoteToTask; Type: TABLE; Schema: public; Owner: joneskim
--

CREATE TABLE public."_NoteToTask" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_NoteToTask" OWNER TO joneskim;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: joneskim
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO joneskim;

--
-- Data for Name: Note; Type: TABLE DATA; Schema: public; Owner: joneskim
--

COPY public."Note" (id, content, created_at, last_modified, tags, code_outputs, backlinks, "references", suggested_links, user_id) FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: joneskim
--

COPY public."Task" (id, title, description, status, priority, due_date, created_at, last_modified, tags, user_id) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: joneskim
--

COPY public."User" (id, email, name, "passwordHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _NoteToTask; Type: TABLE DATA; Schema: public; Owner: joneskim
--

COPY public."_NoteToTask" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: joneskim
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
541c31bc-6735-47b6-b72e-ca8abfbb4780	b7cf2d0309a9ba3ca10bbdd08d6574c5b093477e4f715931d60aa56efa15853a	2025-01-08 18:58:14.81507-06	20241217155618_init	\N	\N	2025-01-08 18:58:14.79871-06	1
\.


--
-- Name: Note Note_pkey; Type: CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: joneskim
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _NoteToTask_AB_unique; Type: INDEX; Schema: public; Owner: joneskim
--

CREATE UNIQUE INDEX "_NoteToTask_AB_unique" ON public."_NoteToTask" USING btree ("A", "B");


--
-- Name: _NoteToTask_B_index; Type: INDEX; Schema: public; Owner: joneskim
--

CREATE INDEX "_NoteToTask_B_index" ON public."_NoteToTask" USING btree ("B");


--
-- Name: Note Note_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Task Task_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _NoteToTask _NoteToTask_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."_NoteToTask"
    ADD CONSTRAINT "_NoteToTask_A_fkey" FOREIGN KEY ("A") REFERENCES public."Note"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NoteToTask _NoteToTask_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joneskim
--

ALTER TABLE ONLY public."_NoteToTask"
    ADD CONSTRAINT "_NoteToTask_B_fkey" FOREIGN KEY ("B") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: joneskim
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

