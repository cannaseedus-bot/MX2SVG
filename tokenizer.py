from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2-1.5B",
    trust_remote_code=True
)

tok.add_tokens([t["content"] for t in tok.backend_tokenizer.to_str().get("added_tokens", [])])

tok.save_pretrained("./mx2lm-qwen2-tokenizer")

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2-1.5B",
    trust_remote_code=True
)

model.resize_token_embeddings(len(tok))
model.save_pretrained("./mx2lm-qwen2-model")
